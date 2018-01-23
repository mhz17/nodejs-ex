//  OpenShift sample Node application
var express = require('express'),
  app = express(),
  morgan = require('morgan');
  Crawler = require("crawler");
  cheerio = require('cheerio');
  json2csv = require('json2csv');
  fs = require('fs');
  csv = require('download-csv');
  url = require('url');
  path = require('path');
  cors = require('cors')

Object.assign = require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))


// error handling
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.header('Access-Control-Allow-Origin', 'https://football-stats-56774.firebaseapp.com');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();

});


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'


var jsonData = {
  results: [
    {
      "date": "",
      "league": "",
      "link": "",
      "homeTeam": "",
      "awayTeam": "",
      "homeScore": "",
      "awayScore": "",
      "homePossessions": "",
      "awayPossessions": "",
      "homeShots": "",
      "awayShots": "",
      "homeShotsOnTarget": "",
      "awayShotsOnTarget": "",
      "homeCorners": "",
      "awayCorners": "",
      "homeFouls": "",
      "awayFouls": "",
      "referee": "",
      "attendance": ""
    }
  ]
};

function clearVariable() {
  return {
    results: [
      {
        "date": "",
        "league": "",
        "link": "",
        "homeTeam": "",
        "awayTeam": "",
        "homeScore": "",
        "awayScore": "",
        "homePossessions": "",
        "awayPossessions": "",
        "homeShots": "",
        "awayShots": "",
        "homeShotsOnTarget": "",
        "awayShotsOnTarget": "",
        "homeCorners": "",
        "awayCorners": "",
        "homeFouls": "",
        "awayFouls": "",
        "referee": "",
        "attendance": ""
      }
    ]
  };
}

var whitelist = [
  'https://football-stats-56774.firebaseapp.com/', 
  'http://localhost:4200', 
  'http://localhost:8080'
]

var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  }else{
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

// Get all posts
app.get('/date:matchdate', cors(corsOptionsDelegate), (req, res) => {

  console.log('URL: ' + 'http://www.bbc.co.uk/sport/football/scores-fixtures/' + req.params.matchdate.replace(':', ''));

  var filelocation = path.resolve('output') + '\\stats.csv';
  fs.truncate(filelocation, 0, function () { console.log('File has been truncated') })

  c = new Crawler({
    maxConnections: 100,
    callback: function (error, response, done) {

      if (error) {

        console.log('Error retrieving main data: ' + error);
        res.send(error.message);

      } else {

        // console.log('Main started');
        var $ = response.$;
        var a = checkIfPageExists($);
        if (a != null) {
          var err = new Error(a);
          res.send(err.message);
        } else {
          getMatchDetails($);
        }

      }

      done();

    }
  });

  c_stats = new Crawler({
    maxConnections: 100,
    callback: function (error, response, done) {

      if (error) {

        console.log('Error retrieving stats: ' + error);
        res.send(error.message);

      } else {
        console.log('Stats started: ' + response.request.uri.href);
        var $ = response.$;
        getMatchStats($, response.request.uri.href);

      }

      done();

    }
  });

  // Queue a list of URLs
  c.queue(['http://www.bbc.co.uk/sport/football/scores-fixtures/' + req.params.matchdate.replace(':', '')]);

  c.on('drain', function () {
    // console.log('Main queue compeleted');
    for (var v in jsonData.results) {
      if (jsonData.results[v].link.length > 0) {
        c_stats.queue([jsonData.results[v].link]);
      }
    }

  });



  c_stats.on('drain', function () {

    console.log('Stats queue completed');

    var fields = ['date',
      'league',
      'link',
      'homeTeam',
      'awayTeam',
      'homeScore',
      'awayScore',
      'homePossessions',
      'awayPossessions',
      'homeShots',
      'awayShots',
      'homeShotsOnTarget',
      'awayShotsOnTarget',
      'homeCorners',
      'awayCorners',
      'homeFouls',
      'awayFouls',
      'referee',
      'attendance'];

    var result = json2csv({ data: jsonData.results, fields: fields });

    fs.writeFile(filelocation, result, 'utf8', function (err) {
      if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved: ' + err);
      } else {
        // console.log('File has been saved');
      }
    });

    res.send(jsonData.results);

  })

});

function checkIfPageExists($) {
  console.log('Check if page exists');
  var v = $('.error-message').children().next().text();
  console.log(v);
  if (v.includes('Unfortunately')) {
    return v;
  } else {
    return null;
  }
}

function getMatchDetails($) {

  var urlStats;
  var Matchdate;
  var League;
  var Home;
  var Away;
  var HomeScore;
  var AwayScore;

  $('.sp-c-date-picker-timeline__item--selected').filter(function () {
    var data = $(this);
    Matchdate = data.children().first().attr('href');
    Matchdate = Matchdate.replace('/sport/football/scores-fixtures/', '');
  });


  $('.sp-c-fixture__block-link').filter(function () {
    var data = $(this);
    urlStats = 'http://www.bbc.co.uk' + data.attr('href');

    if (!data.attr('data-reactid').includes('National League') && !data.attr('data-reactid').includes('Scottish')
      && !data.attr('data-reactid').includes('Italian') && !data.attr('data-reactid').includes('Spanish') && 
      !data.attr('data-reactid').includes('German')) {

      League = data.parent().parent().parent().children().first().text();
      Home = data.children().first().children().first().children().first().children().first().children().first().children().first().attr('title');
      Away = data.children().first().children().first().children().last().children().first().children().first().children().first().attr('title');
      HomeScore = data.children().first().children().first().children().first().children().last().children().text();
      AwayScore = data.children().first().children().first().children().last().children().last().children().text();

      if (jsonData.results.length == 1 && jsonData.results[0].link == "") {
        jsonData.results[0].date = Matchdate;
        jsonData.results[0].league = League;
        jsonData.results[0].link = urlStats;
        jsonData.results[0].homeTeam = Home;
        jsonData.results[0].awayTeam = Away;
        jsonData.results[0].homeScore = HomeScore;
        jsonData.results[0].awayScore = AwayScore;
      }
      else {
        jsonData.results.push(
          { "date": Matchdate, "league": League, "link": urlStats, "homeTeam": Home, "awayTeam": Away, "homeScore": HomeScore, "awayScore": AwayScore }
        );
      }

    }

  });

}

function getMatchStats($, url) {

  var PossessionsHome;
  var PossessionsAway;
  var shotsHome;
  var shotsAway;
  var shotsOnTargetHome;
  var shotsOnTargetAway;
  var cornersHome;
  var cornersAway;
  var foulsHome;
  var foulsAway;
  var refereeName;
  var attendanceCount;

  $('.sp-c-football-match-stats').filter(function () {
    var data = $(this);

    PossessionsHome = data.children().last().children().first().children().first().next().children().last().text();
    PossessionsAway = data.children().last().children().first().children().first().next().next().children().last().text();
    shotsHome = data.children().last().children().first().next().children().first().next().children().last().text();
    shotsAway = data.children().last().children().first().next().children().first().next().next().children().last().text();
    shotsOnTargetHome = data.children().last().children().first().next().next().children().first().next().children().last().text();
    shotsOnTargetAway = data.children().last().children().first().next().next().children().first().next().next().children().last().text();
    cornersHome = data.children().last().children().first().next().next().next().children().first().next().children().last().text();
    cornersAway = data.children().last().children().first().next().next().next().children().first().next().next().children().last().text();
    foulsHome = data.children().last().children().last().children().first().next().children().last().text();
    foulsAway = data.children().last().children().last().children().first().next().next().children().last().text();

  });

  $('#tab-0').filter(function () {
    var data = $(this);
    refereeName = data.children().first().next().children().first().children().last().children().first().children().first().children().last().text();
    attendanceCount = data.children().first().next().children().first().children().last().children().first().children().last().children().last().text();
  });


  for (var i = 0; i < jsonData.results.length; i++) {
    if (jsonData.results[i].link == url) {
      jsonData.results[i].homePossessions = PossessionsHome;
      jsonData.results[i].awayPossessions = PossessionsAway;
      jsonData.results[i].homeShots = shotsHome;
      jsonData.results[i].awayShots = shotsAway;
      jsonData.results[i].homeShotsOnTarget = shotsOnTargetHome;
      jsonData.results[i].awayShotsOnTarget = shotsOnTargetAway;
      jsonData.results[i].homeCorners = cornersHome;
      jsonData.results[i].awayCorners = cornersAway;
      jsonData.results[i].homeFouls = foulsHome;
      jsonData.results[i].awayFouls = foulsAway;
      jsonData.results[i].referee = refereeName;
      jsonData.results[i].attendance = attendanceCount;
    }
  }

}

app.get('/', (req, res) => {
  res.sendfile('views/index.html');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;

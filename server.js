//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    Crawler = require("crawler");
    cheerio = require('cheerio');
    json2csv = require('json2csv');
    fs = require('fs');
    csv = require('download-csv');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'

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

    function clearVariable(){
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

function getMatchDetails($) {

          var urlStats;
          var Matchdate;
          var League;
          var Home;
          var Away;
          var HomeScore;
          var AwayScore;
    
          $('.sp-c-date-picker-timeline__item--selected').filter(function(){
            var data = $(this);
            Matchdate = data.children().first().attr('href');
            Matchdate = Matchdate.replace('/sport/football/scores-fixtures/', '');
          });
    
    
          $('.sp-c-fixture__block-link').filter(function () {
            var data = $(this);
            urlStats = 'http://www.bbc.co.uk' + data.attr('href');
    
            if (!data.attr('data-reactid').includes('National League') && !data.attr('data-reactid').includes('Scottish')
                && !data.attr('data-reactid').includes('Italian') && !data.attr('data-reactid').includes('Spanish')) {
    
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

function myFunc(req, res, next){

    var c = new Crawler({
        maxConnections : 10
    });

    c.direct({
        uri: 'http://www.bbc.co.uk/sport/football/scores-fixtures/' + req.params.matchdate.replace(':', ''),
        skipEventRequest: false, 
        callback: function (error, response) {
            if(error){
                return res.send('Error occured: ' + error)
            }else{
                var $ = response.$;
                getMatchDetails($);

                var fields = ['date', 'league', 'link', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore'];
                var result = json2csv({ data: jsonData.results, fields: fields });
                var filelocation = __dirname + '\\output\\stats.csv';

                fs.writeFile(filelocation, result, 'utf8', function (err) {
                  if (err) {
                    console.log('Some error occured - file either not saved or corrupted file saved.');
                    return res.send(err)
                  } else{
                    console.log('It\'s saved!');
                    return res.download(filelocation, 'stats.csv')
                  }
                });
            }
        }
    });
  
}

app.get('/date:matchdate', myFunc);

app.get('/', (req, res) => {
  res.sendfile('views/index.html');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

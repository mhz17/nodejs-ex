//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    Crawler = require("crawler");
    cheerio = require('cheerio');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'

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
                var Matchdate;

                $('.sp-c-date-picker-timeline__item--selected').filter(function () {
                    var data = $(this);
                    Matchdate = data.children().first().attr('href');
                    Matchdate = Matchdate.replace('/sport/football/scores-fixtures/', '');
                  });

                return res.send('Response here: ' + Matchdate);
            }
        }
    });
  
}

app.get('/date:matchdate', myFunc);

app.get('/', (req, res) => {
  res.send('Incorrect Request');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

// loading modules
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');


// loading scraping tools
var axios = require('axios');
var cheerio = require('cheerio');

// loading database
var db = require('./models')


// configuring app
var PORT = 5300 
var app = express();

app.use(bodyParser.urlencoded({extended:true}));

// serving static files
app.use(express.static('public'));

// uses deployed server if app is deployed
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://Derrick:derrick123@ds137631.mlab.com:37631/uscrape"

// connecting to database
mongoose.connect(MONGODB_URI)

/////////////////////// ROUTES

// a GET route for scraping BBC news website

app.get('/scrape',function(req,res){
    axios.get('https://www.bbc.com/news').then(function(response){
        var $ = cheerio.load(response.data)
       

        $('.nw-c-top-stories__secondary-item').each(function(i,element){
         
          var urlRoot = 'https://www.bbc.com'
          var  result = {};
          result.title =  $(element).find('h3').text()
          result.summary = $(element).find('p').text()
          result.link = urlRoot + $(element).find('a').attr('href')
         
          db.Article.create(result)
        //   .then(function(dbArticle){
        //       console.log(dbArticle)
        //   })
        //   .catch(function(err){
        //     console.log('hello lovely')
        //   });
        });

        res.send('BBC Scrape Complete!')
    });
});

app.get('/articles', function(req,res){
    db.Article.find({})
    .then(function(dbArticle){
        res.json(dbArticle)
    })
    .catch(function(err){
        res.json(err)
    })
});

app.get('/articles/:id',function(req,res){
    db.Article.findOne({_id: req.params.id})
    .populate('note')
    .then(function(dbArticle){
        res.json(dbArticle)
    })
    .catch(function(err){
      res.json(err);
    });
});

app.post('/articles/:id',function(req,res){
    db.Note.create(req.body)
    .then(function(dbNote){
        return db.Article.findOneAndUpdate({_id:req.params.id}, {note: dbNote._id},{new:true})
    })
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err)
    })
})

// starting server
app.listen(PORT, function(){
    console.log('app listening on port: ' + PORT)
})
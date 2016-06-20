'use strict';
var express = require('express');
var router = express.Router();
/*var tweetBank = require('../tweetBank');*/
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next) {

    var q = 'SELECT users.name, tweets.content, tweets.id FROM users INNER JOIN tweets ON users.id = tweets.userid';

    client.query(q, function (err, result) {
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    var name = req.params.username;
    var q = 'SELECT users.name, tweets.content, tweets.id FROM users INNER JOIN tweets ON users.id = tweets.userid WHERE users.name=$1';
    client.query(q, [name], function (err, result) {
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var id = req.params.id;
    var q = 'SELECT users.name, tweets.content, tweets.id FROM users INNER JOIN tweets ON users.id = tweets.userid WHERE tweets.id=$1';
    client.query(q, [id], function (err, result) {
      if (err) return next(err);
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var name = req.body.name;
    var content = req.body.content;
    
    var userQuery = 'SELECT users.name, users.id FROM users WHERE users.name=$1';
    var newTweetQuery = 'INSERT INTO tweets (userid, content) VALUES ($1, $2)';
    var newUserQuery = 'INSERT INTO users (name) VALUES ($1)';
    var tweetQuery = 'SELECT tweets.id FROM tweets WHERE tweets.content=$1'
    var newTweet = {
      name: name,
      content: content,
      id: null
    };

    function handleUserQuery (err, result) {
      if (err) return next(err);
      if (!result.rows.length) {
        // if there is no user with this name, call handleNewUser
        client.query(newUserQuery, [name], handleNewUser);
        client.query(userQuery, [name], handleUserQuery);
      } else {
        var userId = result.rows[0].id;
        client.query(newTweetQuery, [userId, content], handleNewTweet);
      }
    }

    function handleNewUser (err, result) {
      if (err) return next(err);
      // create new user
    }

    function handleNewTweet (err, result) {
      if (err) return next(err);
      // create new tweet
      client.query(tweetQuery, [content], queryForTweet);
    }

    function queryForTweet (err, result) {
      if (err) return next(err);
      newTweet.id = result.rows[0].id;
    }

    client.query(userQuery, [name], handleUserQuery);

    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
  });

  // delete a tweet
  router.post('/delete/:id', function (res, req, next) {
    console.log(req.params);
    /*var tweetId = req.params.id;
    var q = 'DELETE FROM tweets WHERE tweets.id=$1';

    client.query(q, [tweetId], function (err, result) {
      if (err) return next(err);
    });*/

    res.redirect('/');

  });

  return router;
};
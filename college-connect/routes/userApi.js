const express = require('express');
const _ = require('lodash');
const uniqid = require('uniqid');
const nodemailer = require('nodemailer');
const generatePassword = require('password-generator');
const md5 = require('md5');
const cookieParser = require('cookie-parser');
const {OAuth2Client} = require('google-auth-library');
var ObjectId = require('mongodb').ObjectID;
var router = express.Router();
module.exports = router;

var {User} = require('./../models/userModel');

var g_token = "312975383578-aoia4cu34demtrstbhdkhg6shhjbiedc.apps.googleusercontent.com";

// GET signin page
router.get('/signin', (req, res) => {
  res.render('signin',{
    g_token : g_token
  });
});



router.post('/google/signin', (req, res) => {
  try {
    date = new Date();
  async function verify() {
    const ticket = await client.verifyIdToken({
        idToken: req.body.idToken,
        audience: g_token
    });
    const payload = ticket.getPayload();
    if(payload.email_verified){
      var body = {
        'email' : payload.email,
        'name' : payload.name,
        'password' : payload.sub,
        'profilePicture' : payload.picture,
        'googlePhoto' : payload.picture,
        'timeLag' : date.getTime() - req.body.time,
        'joinDate' : date.getTime()
      }
      var user = new User(body);
      user.save().then(() => {
        res.status(200);
        user.generateAuthToken().then((token) => {
          res.cookie('li',1, { maxAge: 3075840000, path:'/' });
          res.cookie('x-auth', token, { maxAge : 3075840000, path : '/'});
          res.json({msg:'success'});
          // TODO : Implement Slack and Email notification logic
        });
      }).catch((e) => {
          User.findByCredentials(body.email, body.password).then((user) => {
            user.generateAuthToken().then((token) => {
              res.cookie('li',1, { maxAge: 30758400000, path:'/' });
              res.cookie('x-auth', token, { maxAge : 3075840000, path : '/'});
              res.json({msg:'success'});
            }).catch((e) => {console.log('error generating auth token')});
          }).catch((e) => {
            console.log('login failed')
            res.status(400).send(e);
          });
      })
    }else {
      throw new Error('token verification failed');
    }
  }
  verify().catch( (e) => { console.log('token verification failed'); res.status(400).send('error') });  
  } catch (error) {
    console.log(error);
    res.status(500).send('Error proccesing request.');
    var err = error;
    if(err){
      var apiName = req.method + ' ' + req.originalUrl;
      if(typeof err == 'object'){
          var errMsg = '*File : ' + fileName + '*\n*API : ' + apiName + '*\nError - ```' + JSON.stringify(err, Object.getOwnPropertyNames(err), 2) + '```';
      }else{
          var errMsg = '*File : ' + fileName + '*\n*API : ' + apiName + '*\nError - ```' + err + '```';
      }
      console.log(errMsg);
    }
  }
    
});

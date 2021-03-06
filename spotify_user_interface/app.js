var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');	
var MongoClient = require("mongodb").MongoClient;

var client_id = '325f0c35df2a40cba5cec2c31d8c0d2e'; // Your client id
var client_secret = '4f4d6244004c4de592f63853ed9f45e6'; // Your secret
var redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

//app.set(__dirname + '/public');
//app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use(cookieParser())
   .use(bodyParser.urlencoded({ limit: '100mb',extended: true }))
   .use(bodyParser.json({limit: "100mb"}));

// ROUTES FOR SPOTIFY_USER_INTERFACE API
// =============================================================================

MongoClient.connect("mongodb://localhost/suidb", function(error, db) {
	if (error) console.log(error);
	SUIDB = db;
	console.log('You are connected to spotify_user_interface_database');
})

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          //console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

////////// BEGINNING OF OUR API //////////

app.post('/add-played-tracks', function(req, res){
  var params = req.body.items;
  SUIDB.collection('playedtracks').insert(params, function(){
    res.send('add-played-tracks');
  });
});

app.post('/features-tracks', function(req, res){
  var params = req.body;
  SUIDB.collection('features').insert(params, function(){
    res.send('add-features');
  });
});

app.get("/dataTracks", function(req, res){
    SUIDB.collection('playedtracks').aggregate([
        { $group:
            { 
                _id: { track_id: "$track.id", track_name: "$track.name", artist_name: "$track.artists.name", played_at: "$played_at", covers: "$track.album.images"},
                somme: {$sum: 1}
            }
        }
    ]).toArray(function (err,docs){
        res.json(docs);
    });  
 });
 
 app.get("/idDataTrack", function(req, res){
    SUIDB.collection('playedtracks').aggregate([
        { $group:
            { 
                _id: "$track.id"
            }
        }
    ]).toArray(function (err,docs){
        res.json(docs);
    });  
 });
 
app.get("/oneTrackFeatures", function(req, res){
    var id = req.query.idTrack;
    console.log(id);
    SUIDB.collection('features').findOne({
        id: id.toString()
    }, function (err,docs){
        res.json(docs);
    });
 });
 
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 // DEBUT DES TRAITEMENTS SUR LA MASSE /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 app.get("/averageListenedTracks", function(req, res){
     
    SUIDB.collection('features').updateMany({}, { $set: { "group" : "1" } });
    SUIDB.collection('features').aggregate([
        { $group:
            { 
                _id:  "$group",
                avg_acousticness : {$avg: "$acousticness"},
                avg_danceability : {$avg: "$danceability"},
                avg_energy : {$avg: "$energy"},
                avg_liveness : {$avg: "$liveness"},
                avg_loudness : {$avg: "$loudness"},
                avg_speechiness : {$avg: "$speechiness"},
                avg_tempo : {$avg: "$tempo"}
            }
        }
    ]).toArray(function (err,docs){
        res.json(docs);
    });
    
 });
   
console.log('Your Spotify Interface on 8888');
app.listen(8888);

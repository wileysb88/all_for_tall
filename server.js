// require dependencies
// --------------------
require('dotenv').config();
var GooglePlaces     = require('google-locations'),
    express    = require('express'),
    bodyParser = require('body-parser'),
    cors       = require('cors'),
    app        = express();

var places = new GooglePlaces(process.env.GOOGLE_API_KEY_SERVER);

app.use(cors());

// set the location for our public and view folders
// ------------------------------------------------
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');


// config stuff for body-parser
// ----------------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// set up controllers
// ------------------
app.get('/', function(req, res, next){
  res.sendFile(__dirname + '/public/views/index.html');
})



app.post('/location', function(req, res, next){
  // console.log(req.body.place);
  var result;

  places.autocomplete({input: req.body.place, types: "geocode"}, function(err, response) {
    if (err) {
      console.log(err);
      res.send(err);
    }else if (response.predictions[0]){
      result = response.predictions[0].description;
      console.log("autocomplete: ", result);
      res.send(result);
    } else{
      console.log("NO RESULTS");
      res.send('NO RESULTS');
    }


    // var success = function(err, response) {
    //   console.log("did you mean: ", response.result.name);
    // };


  });



})


// start the server!
// -----------------
var server = app.listen(process.env.PORT || 5000, function(){
  console.log('The server is listening on port ' + server.address().port);
})

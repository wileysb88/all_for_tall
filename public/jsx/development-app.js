var React    = require('react'),
    ReactDOM = require('react-dom');

var Container = React.createClass({
  getInitialState: function(){
    return {
      lat: 0,
      lng: 0,
      myLocation: '',
      username: '',
      locations: [],
      loggedIn: false,
    }
  },
  login: function(username, homeLocation) {
    // set our container state to logged in
    var state = this.state;
    state.loggedIn = true;
    state.username = username;
    state.myLocation = homeLocation;
    this.setState(state);
    console.log(this.state);
  },
  logout: function() {
    // set our container state to logged in
    var state = this.state;
    state.loggedIn = false;
    state.username = '';
    state.myLocation = '';
    this.setState(state);
  },
  createMap: function() {
    var self  = this;
    var state = this.state;
    // set up the map
    state.map = new GMaps({
      div: '#map',
      lat: state.lat,
      lng: state.lng,
      idle: function(){
        // this is where functionality would go to update the map everytime the user stops interacting with it
      }
    });
    // save our map in the container state so all children can access it
    this.setState(state);
  },
  // takes a lat, lng, and location name ('444 n wabash, chicago, IL')
  // and saves in the container state as the user's 'current position'
  // this is the positon that will be attached to all posts they make
  // it also grabs all nearby reviews
  setPosition: function(lat, lng, myLocation){
    var self = this;
    var state = this.state;
    state.lat = lat;
    state.lng = lng;
    state.myLocation = myLocation;

    $.ajax({
      method: 'post',
      url: 'https://narwhals-whowhatwhereapi.herokuapp.com/search',
      data: { lat: lat, lng: lng, radius: 10 },
      success: function(returnedLocations){
        state.locations = returnedLocations;
        self.setState(state);
        console.log(state);
      },
      error: function(err){
        console.log(err);
      }
    })

  },
  // render this container and all its kids!
  render: function(){
    return(
      <div className="container">
        <Buttons  login={ this.login }
                  logout={ this.logout }
                  loggedIn={ this.state.loggedIn }
                  username={ this.state.username }/>
        <FeedContainer lat={ this.state.lat }
                       lng={ this.state.lng }
                       loggedIn={ this.state.loggedIn }
                       myLocation={ this.state.myLocation }
                       username={ this.state.username }/>

        <GoogleMap  lat={ this.state.lat }
                    lng={ this.state.lng }
                    locations={ this.state.locations }
                    setPosition={ this.setPosition }
                    createMap = { this.createMap }
                    map={ this.state.map }
                    loggedIn={ this.state.loggedIn }/>
      </div>

    )
  }
})


// class for the map and its address search box
var GoogleMap = React.createClass({
  centerMap: function(lat, lng, myLocation){
    this.props.setPosition(lat, lng, myLocation); // function from container to set location globally
    // gmaps methods
    this.props.map.setCenter(lat, lng);
    this.props.map.addMarker({
        lat: lat,
        lng: lng
      })
  },
  // takes an array of location objects and places map markers for all of them
  addMarkers: function(){
    var self = this;
    this.props.locations.forEach(function(location){
      self.props.map.addMarker({
        lat: location.lat,
        lng: location.lng,
        infoWindow: {
          content: ('<p><b>' + location.placeName+ '</b></p><p>' + location.comment + '</p>')
        }
      });
    })
  },
  componentDidMount: function(){
    var self = this;
    this.props.createMap();

    // show "loading" here
    // not yet implemented

    // find user's position w/gmaps geolocate function
    GMaps.geolocate({
      success: function(position) {
        // hide "loading" here
        self.centerMap(position.coords.latitude, position.coords.longitude);
      },
      error: function(error) {
        console.log('Geolocation failed: ' + error.message);
      },
      not_supported: function() {
        console.log("Your browser does not support geolocation");
      },
      always: function() {
        console.log("Done!");
      }
    });
  },

  render: function(){
    this.addMarkers();
    return(
      <div id="map-and-search">
        <div id='map'></div>
        <AddressSearch
          centerMap={ this.centerMap }/>
      </div>

    )
  }
})


var AddressSearch = React.createClass({
  addressSearchHandler: function(e){
    var self = this;
    e.preventDefault();
    var address = $('#address-search').val();

    if (address){
      // ajax to google places api on the server
      // returns its best guess of a location
      // depending on what the user enters
      // there is probably a better implementation for what we are trying to accomplish here
      $.ajax({
        method: 'post',
        url: '/location',
        data: { place: address },
        success: function(data){
          console.log(data);
          // function to make [AJAX] call and grab locations
          // take the address and center the map at that location
          GMaps.geocode({
            address: data,
            callback: function(results, status) {
              if (status == 'OK') {
                var latlng = results[0].geometry.location;
                self.props.centerMap(latlng.lat(), latlng.lng(), data);
              }
            }
          });

        },
        error: function(err){
          console.log(err);
        }
      })
    }
  },
  render: function(){
    return(
      <form id="search-form">
        <input id="address-search" type="text" placeholder="ENTER A LOCATION"></input>
        <br />
        <button id="address-search-button" type="button" onClick={ this.addressSearchHandler }>SEARCH ADDRESS</button>
      </form>
    )
  }
})




// holds news feed, welcome and create post 'views'
// its state keeps track of which 'view' to display
var FeedContainer = React.createClass({
  getInitialState: function(){
    return { displayWelcome: true,
             displayFeed: false,
             displayPost: false
             }
  },
  // future versions of this project can probably cut this down to one function vs 3
  changeToFeed: function(){
    var state = { displayWelcome: false,
                  displayFeed: true,
                  displayPost: false }
    this.setState(state);
  },
  changeToPost: function(){
    var state = { displayWelcome: false,
                  displayFeed: false,
                  displayPost: true }
    this.setState(state);
  },
  changeToWelcome: function(){
    var state = { displayWelcome: true,
                  displayFeed: false,
                  displayPost: false }
    this.setState(state);
  },
  render: function(){
    console.log(this.props.username);
    return(
      <div className="feed-container">
        <h1 id="feed-top-message">Hi { this.props.username ? this.props.username + '!' : 'there! You must be logged in to post.' }</h1>
        { this.state.displayWelcome ? <Welcome /> : null }
        { this.state.displayFeed ? <Feed changeToFeed={ this.changeToFeed } lat={ this.props.lat } lng={ this.props.lng }/> : null }
        { this.state.displayPost && this.props.loggedIn ? <Post lat={ this.props.lat } lng={ this.props.lng } myLocation={ this.props.myLocation } username={ this.props.username } loggedIn={ this.props.loggedIn }/> : null }
        { this.state.displayPost ?  null : <button id="post-button"onClick={ this.changeToPost }>POST</button> }
        { this.state.displayFeed ?  null: <button id="results-button" onClick={ this.changeToFeed }>RESULTS</button> }
        { this.state.displayWelcome ?  null : <button id="about-button" onClick={ this.changeToWelcome }>ABOUT</button> }

      </div>
    )
  }
})

var Feed = React.createClass({
  getInitialState: function(){
    return { locations: [] }
  },
  componentWillReceiveProps: function(nextProps, nextState){
    // when the coordinates of the container component change,
    // grab new 'feed' items from the database
    this.updateFeedItems(nextProps.lat, nextProps.lng);
  },
  shouldComponentUpdate: function(nextProps, nextState){
    // do not update the component if the user's location has not changed
    // or if the list of locations has not changed
    // this prevents infinite looping issues
    if (nextProps.lat != this.props.lat && nextProps.lng != this.props.lng) {
      return true;
    } else if (nextState.locations != this.state.locations) {
      return true;
    } else {
      return false;
    }
  },
  updateFeedItems: function(lat, lng){
    var self = this;

    $.ajax({
      method: 'post',
      url: 'https://narwhals-whowhatwhereapi.herokuapp.com/search',
      data: { lat: lat, lng: lng, radius: 10 },
      success: function(returnedLocations){
        var state = {};
        // console.log('ajax');
        state.locations = returnedLocations;
        self.setState(state);
      },
      error: function(err){
        console.log(err);
      }
    })

  },
  render: function(){
    var self = this;
    var locations = this.state.locations.map(function(location, i){
      console.log(location)
      return(
          <FeedItem
            key={ i }
            name={ location.placeName }
            comment={ location.comment }
            picture={ location.picture }
            updateFeedItems={ self.updateFeedItems }/>
      )
    })
    return(
      <article>
        <h1 id="post-instruction">Click SEARCH ADDRESS to join the conversation!</h1>
        <h4 id="post-instruction">Here's what people are talking about...</h4>
        { locations }
      </article>
    )
  }
})

var Picture = React.createClass({
  render: function(){
    return <img src={ this.props.picture } />
  }
})

// holds a review from the database
// with an image, comment, etc.
var FeedItem = React.createClass({
  clickHandler: function(e){
    console.log('you clicked a list item!');
    // function to update feed so it shows only items for that location
    this.props.updateFeedItems();

  },
  render: function(){
    return(
      <div className="feed-item" onClick={ this.clickHandler }>
        <p><em>{ this.props.name }</em></p>
        <p>{ this.props.comment }</p>
        { this.props.picture ? <Picture picture={ this.props.picture } /> : null }
      </div>
    )
  }
})

var Welcome = React.createClass({
  render: function(){
    return (
      <div>
        <p id="welcome-p">
          Welcome to WHO/WHAT/WHERE! The place to see and share who is doing what in your city!
          <br />
          <br />
          Share pictures, comments and more to the interactive map where others can catch a glimpse of the social activity around you!
          Click on the map markers and read what people are doing at that location!
          <br />
          <br />
          Search the map to see the city's posts to help you get off the couch and explore your city's WHO, WHAT and WHERE!
        </p>
        <p id="welcome-p">
          Enter a location and press SEARCH ADDRESS to get started!
        </p>
      </div>
    )
  }
})

var Post = React.createClass({
  getInitialState: function(){
    return { message: '',
             name: '',
             comment: '' }
  },
  postHandler: function(e){
    e.preventDefault();
    var self = this;
    var state = this.state;
    // save current info in state so it can be sent to db
    state.time = Date.now();
    state.lat = this.props.lat;
    state.lng = this.props.lng;
    state.placeName = this.props.myLocation;

    // can't post if ya ain't logged in
    if (this.props.loggedIn){
      $.ajax({
        method: 'post',
        url: 'https://narwhals-whowhatwhereapi.herokuapp.com/create', // whatever this route is supposed to be
        data: state,
        success: function(data){
          console.log(data);
          var state = self.state;
          state.message = "Thanks for posting!";
          self.setState(state);
        },
        error: function(err){
          var state = self.state;
          state.message = "Something went wrong! Please make sure you are logged in and all your information is correct."
          self.setState(state);
          console.log(err);
        }
      });
    } else console.log('log in, mannnn.')

  },
  // function to update state variables as user inputs text
  textChange: function(e){
    var state = this.state;
    state[e.target.name] = e.target.value;
    this.setState(state);
  },
  // function to update state variables as user uploads new image
  imageChange: function(event){
    var input = $('#imgUpload')[0].files[0];
    var reader = new FileReader();
    var state = this.state;
    var self = this;

    reader.onload = function (e) {
      // console.log(e.target.result);
      state.picture = e.target.result;
      self.setState(state);
      $("#images").val(e.target.result);
    // console.log($('#myImage').val())
    };

    reader.readAsDataURL(input);
  },
  render: function(){
    return (
      <div>
        <h3 id="new-post-title">New post for { this.props.myLocation }</h3>
        <div> { this.state.message } </div>
        <form id="post-form" onSubmit={ this.postHandler }>
            <input id="imgUpload" type="file" name="image" onChange={ this.imageChange }></input>
            <br />
            <br />
            <label id="post-label">Comment: </label>
            <input id="post-input-nonpic" type="text" name="comment" onChange={ this.textChange }></input>
            <br />
            <br />
            <label id="post-label">Name:</label>
            <input id="post-input-nonpic" type="text" name="userName" onChange={ this.textChange }></input>
            <br />
            <br />
            <button id="upload-button" type="submit">UPLOAD</button>
            <div id="images"></div>
        </form>
      </div>
    )
  }
})

// parent component for login/logout buttons
// this component may not be necessary
var Buttons = React.createClass({
  render: function(){
    return (
        <div>
          { this.props.loggedIn  ? <LogOut username={ this.props.username } logout={ this.props.logout } /> :  <LogIn login={ this.props.login } />  }
        </div>

    )
  },
})

// login button
var LogIn = React.createClass({
  getInitialState: function(){
    // state holds user data to be sent to api via ajax
    return{
      username: '',
      email: '',
      password: ''
    }
  },
  loginHandler: function(e){
    var self = this;
    e.preventDefault();
    var state = this.state;
    $.ajax({
      method: 'post',
      url: 'https://narwhals-whowhatwhereapi.herokuapp.com/users/login',
      data: state,
      success: function(data){
        console.log(data);
        if(data.success){

          self.props.login(data.username, data.homeLocation)
        }else{
          console.log("NOT THE RIGHT PASSWORD OR EMAIL")
        }
      },
      error: function(err){
        console.log(err);
      }
    });
  },
  registerHandler: function(e){
    var self = this;
    e.preventDefault();
    var state = this.state;
    $.ajax({
      method: 'post',
      url: 'https://narwhals-whowhatwhereapi.herokuapp.com/users/signup',
      data: state,
      success: function(data){
        console.log(data);
        if(data.success){
          console.log('you successfully registered an account')
          console.log(self.props);
          self.props.login()
        }else{
          console.log('something went wrong')
        }
      },
      error: function(err){
        console.log(err);
      }
    });
  },
  textChange: function(e){
    var state = this.state;
    state[e.target.name] = e.target.value;
    this.setState(state);
  },
  render: function(){
    return(
      <div id="header">
        <div id="title">WHO/WHAT/WHERE</div>
        <div className="input-row">
          <form id="login-form" onSubmit={ this.loginHandler }>

            <input className="email" type="text" name="email" placeholder="ENTER EMAIL"onChange={ this.textChange }></input>

            <input className="password" type="password" name="password" placeholder="ENTER PASSWORD" onChange={ this.textChange }></input>
            <button type="submit">LOGIN</button>
          </form>
            <br />
            <a className="register" href="#register-popup">Not Registered? Sign Up!</a>
            <div className="overlay" id="register-popup">
                <div className="popup">
                  <h4 id="register-title">ENTER INFO</h4>
                  <a className="close" href="#">&times;</a>
                  <form id="register-form" onSubmit={ this.registerHandler }>
                        <label className="register-label">Username: </label>
                        <input className="register-input" type="text" name="username" onChange={ this.textChange }></input>
                    <br />
                    <br />
                        <label className="register-label">Email: </label>
                        <input className="register-input" type="text" name="email" onChange={ this.textChange }></input>
                    <br />
                    <br />
                        <label className="register-label">Password: </label>
                        <input className="register-input" type="password" name="password" onChange={ this.textChange }></input>
                    <br />
                    <br />
                        <label className="register-label">Re-Confirm Password: </label>
                        <input className="register-input" type="password" name="reconfirmpassword" onChange={ this.textChange }></input>
                    <br />
                    <br />
                        <label className="register-label">Default Address: </label>
                        <input className="register-input" type="text" name="homeLocation" onChange={ this.textChange }></input>
                    <br />
                    <br />
                        <button id="register-button" type="submit">REGISTER</button>
                  </form>

                </div>
              </div>
        </div>
      </div>
    )
  }
})


var LogOut = React.createClass({
  handleLogoutClick: function(event){
    $.ajax({
      method: 'get',
      url: 'https://narwhals-whowhatwhereapi.herokuapp.com/users/logout',
      error: function(err){
        console.log(err);
      }
    })
    this.props.logout();
    console.log('ATTEMPTED LOGOUT!')
  },
  render: function(){
    console.log(this.props)
    return(
      <div id="header">
        <div id="title">WHO/WHAT/WHERE</div>
        <div id="signed-in">
          <div id="welcome-message"> Welcome { this.props.username } </div>
          <button id="logout-button" onClick={this.handleLogoutClick} type="button">LOGOUT</button>
        </div>
      </div>

    )
  }
})

ReactDOM.render(<Container />, document.querySelector('main'));

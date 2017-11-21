# Spotify User Interface

## Installation

This project run on Node.js.

Once installed, clone the repository and install its dependencies running:

    $ npm install

## Running 
In order to run the different examples, open the folder with the name of the flow you want to try out, and run its `app.js` file. For instance, to run the Authorization Code example do:

    $ cd spotify_user_interface
    $ node app.js

Then, open `http://localhost:8888` in a browser.

### Using your own credentials
This project contains a working client ID and secret key. Note, however, that they might be rate limited if they are used frequently. If you are planning to create an application, we recommend you register your app and get your own credentials instead of using the ones in this project.

Go to [My Applications on Spotify Developer](https://developer.spotify.com/my-applications) and create your application. For the examples, we registered these Redirect URIs:

* http://localhost:8888 (needed for the implicit grant flow)
* http://localhost:8888/callback

Once you have created your app, replace the `client_id`, `redirect_uri` and `client_secret` in the examples with the ones you get from My Applications.

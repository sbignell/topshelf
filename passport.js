'use strict';

exports = module.exports = function(app, passport) {
  var LocalStrategy = require('passport-local').Strategy,
      TwitterStrategy = require('passport-twitter').Strategy,
      GitHubStrategy = require('passport-github').Strategy,
      FacebookStrategy = require('passport-facebook').Strategy,
      GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
      TumblrStrategy = require('passport-tumblr').Strategy;

  passport.use(new LocalStrategy(
    function(username, password, done) {

      if (username.indexOf('@') === -1) {
        //conditions.username = username;
        var conditions = { isActive: 'yes', username: username };
      }
      else {
        //conditions.email = username.toLowerCase();
        var conditions = { isActive: 'yes', email: username.toLowerCase() };
      }

      app.db.models.User.findOne({
          where: conditions
       }).then(function(user) {
          //console.log('User returned.');
          //console.dir(user);

          if (!user) {
            return done(null, false, { message: 'Unknown user' });
          }
          
          app.db.models.User.validatePassword(password, user.password, function(err, isValid) {
            if (err) {
              return done(err);
            }

            if (!isValid) {
              return done(null, false, { message: 'Invalid password' });
            }

            return done(null, user);
          });

      });

    }
  ));

  if (app.config.oauth.twitter.key) {
    passport.use(new TwitterStrategy({
        consumerKey: app.config.oauth.twitter.key,
        consumerSecret: app.config.oauth.twitter.secret
      },
      function(token, tokenSecret, profile, done) {
        done(null, false, {
          token: token,
          tokenSecret: tokenSecret,
          profile: profile
        });
      }
    ));
  }

  if (app.config.oauth.github.key) {
    passport.use(new GitHubStrategy({
        clientID: app.config.oauth.github.key,
        clientSecret: app.config.oauth.github.secret,
        customHeaders: { "User-Agent": app.config.projectName }
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (app.config.oauth.facebook.key) {
    passport.use(new FacebookStrategy({
        clientID: app.config.oauth.facebook.key,
        clientSecret: app.config.oauth.facebook.secret
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (app.config.oauth.google.key) {
    passport.use(new GoogleStrategy({
        clientID: app.config.oauth.google.key,
        clientSecret: app.config.oauth.google.secret
      },
      function(accessToken, refreshToken, profile, done) {
        done(null, false, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile
        });
      }
    ));
  }

  if (app.config.oauth.tumblr.key) {
    passport.use(new TumblrStrategy({
        consumerKey: app.config.oauth.tumblr.key,
        consumerSecret: app.config.oauth.tumblr.secret
      },
      function(token, tokenSecret, profile, done) {
        done(null, false, {
          token: token,
          tokenSecret: tokenSecret,
          profile: profile
        });
      }
    ));
  }

  passport.serializeUser(function(user, done) {
    //console.log('passport.serializeUser');
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    //console.log('passport.deserializeUser');
    app.db.models.User.findOne({
        where: {id: id} 
     })
    .then(function(user) {
        //console.log('User deserialized.');
        //console.dir(user);

        done(null, user);

    });


  });
};

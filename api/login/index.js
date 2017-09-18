'use strict';

var getReturnUrl = function(req) {
  var returnUrl = req.user.defaultReturnUrl();
  if (req.session.returnUrl) {
    returnUrl = req.session.returnUrl;
    delete req.session.returnUrl;
  }
  return returnUrl;
};

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(getReturnUrl(req));
  }
  else {
    res.render('login/index', {
      oauthMessage: '',
      oauthTwitter: !!req.app.config.oauth.twitter.key,
      oauthGitHub: !!req.app.config.oauth.github.key,
      oauthFacebook: !!req.app.config.oauth.facebook.key,
      oauthGoogle: !!req.app.config.oauth.google.key,
      oauthTumblr: !!req.app.config.oauth.tumblr.key
    });
  }
};

exports.check = function(req, res){

  //console.log('check user...');
  //console.dir(req.user);

  if(req.isAuthenticated()){
    console.log('check: logged in');
    //console.dir(req.user);
    res.send(JSON.stringify(req.user));
  } else {
    console.log('check: not logged in');
    res.send('{}');
    //return '{error: not logged in}';
  } 

};

exports.login = function(req, res){
  var workflow = req.app.utility.workflow(req, res);
  console.log('reached login');

  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    //workflow.emit('abuseFilter');
    workflow.emit('attemptLogin');
  });

  workflow.on('abuseFilter', function() {
    var getIpCount = function(done) {
      var timeLimit = Date.now() - req.app.config.loginAttempts.logExpiration;
      var conditions = { ip: req.ip, time: { gt: timeLimit } };
      req.app.db.models.LoginAttempt.count({where: conditions}).then(function(count) {

        done(null, count);
      });
    };

    var getIpUserCount = function(done) {

      req.app.db.models.User.findOne({
          where: {
            username: req.body.username
          }
       }).then(function(user){

          var timeLimit = Date.now() - req.app.config.loginAttempts.logExpiration;
          if(user){
            var conditions = { ip: req.ip, userId: user.id, time: { gt: timeLimit } };
            req.app.db.models.LoginAttempt.count({where: conditions}).then(function(count) {

            done(null, count);
          });

          } else {
            done(null, 0);
          }

          

       });
      
    };

    var asyncFinally = function(err, results) {
      console.log('reached async');
      if (err) {
        console.log('err');
        return workflow.emit('exception', err);
      }

      if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
        console.log('reached limit');
        workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
        return workflow.emit('response');
      }
      else {
        workflow.emit('attemptLogin');
      }
    };

    require('async').parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
  });

  workflow.on('attemptLogin', function() {
    console.log('reached attemptLogin');
    //console.log(req);
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        console.log('err: ' + err);
        return workflow.emit('exception', err);
      }

      if (!user) {
        console.log('no user');
        req.app.db.models.User.findOne({
            where: {
              username: req.body.username
            }
         }).then(function(user){
            if(user){
              var fieldsToSet = { ip: req.ip, user: user.id };
              req.app.db.models.LoginAttempt.build(fieldsToSet).save().then(function(doc) {

              workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
              return workflow.emit('response');
              });

            } else {
              workflow.outcome.errors.push('Username and password combination not found or your account is inactive.');
              return workflow.emit('response');
            }
          
          });
      }
      else {
        console.log('go to login');
        req.login(user, function(err) {
          if (err) {
            console.log('err');
            return workflow.emit('exception', err);
          }
          console.log('all good: ');
          workflow.outcome.userid = user.dataValues.id;
          workflow.outcome.username = user.dataValues.username;
          workflow.outcome.roles = user.dataValues.roles;
          workflow.outcome.firstname = user.dataValues.firstname;
          workflow.outcome.lastname = user.dataValues.lastname;
          workflow.outcome.isActive = user.dataValues.isActive;
          workflow.outcome.isVerified = user.dataValues.isVerified;
          workflow.outcome.groups = user.dataValues.groups;
          workflow.outcome.phone = user.dataValues.phone;
          workflow.outcome.twitterKey = user.dataValues.twitterKey;
          workflow.outcome.facebookKey = user.dataValues.facebookKey;
          workflow.outcome.googleKey = user.dataValues.googleKey;
          workflow.outcome.githubKey = user.dataValues.githubKey;
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.loginTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'twitter.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Twitter account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'github.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your GitHub account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'facebook.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Facebook account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginGoogle = function(req, res, next){
  req._passport.instance.authenticate('google', { callbackURL: '/login/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    req.app.db.models.User.findOne({ 'google.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Google account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

exports.loginTumblr = function(req, res, next){
  req._passport.instance.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/login/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({ 'tumblr.id': info.profile.id }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        res.render('login/index', {
          oauthMessage: 'No users found linked to your Tumblr account. You may need to create an account first.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return next(err);
          }

          res.redirect(getReturnUrl(req));
        });
      }
    });
  })(req, res, next);
};

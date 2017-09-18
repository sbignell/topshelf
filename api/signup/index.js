'use strict';

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('signup/index', {
      oauthMessage: '',
      oauthTwitter: !!req.app.config.oauth.twitter.key,
      oauthGitHub: !!req.app.config.oauth.github.key,
      oauthFacebook: !!req.app.config.oauth.facebook.key,
      oauthGoogle: !!req.app.config.oauth.google.key,
      oauthTumblr: !!req.app.config.oauth.tumblr.key
    });
  }
};

exports.signup = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    console.dir(req.body);
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
      workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
    }

    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
    //workflow.emit('duplicateEmailCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    console.log('duplicateUsernameCheck');
    req.app.db.models.User.find({ where: { username: req.body.username } }).then(function(user) {


      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    console.log('duplicateEmailCheck');
    req.app.db.models.User.findOne({ where: { email: req.body.email.toLowerCase() } }).then(function(user) {

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      //we need to set a verification timeframe.. and role etc

      var fieldsToSet = {
        isActive: 'yes',
        isVerified: 'no',
        createdById: '0',
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        password: hash,
        roles: req.body.roles
      };
      req.app.db.models.User.create(fieldsToSet).then(function(user) {
        if (!user) {
          return workflow.emit('exception', user);
        }

        workflow.outcome.userid = user.dataValues.id;
        workflow.outcome.username = user.dataValues.username;
        workflow.outcome.roles = user.dataValues.roles;
        workflow.emit('sendWelcomeEmail');
      });
    });
  });

  workflow.on('sendWelcomeEmail', function() {
    req.app.utility.sendmail(req, res, {
      from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
      to: req.body.email,
      subject: 'Your '+ req.app.config.projectName +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: req.body.username,
        email: req.body.email,
        loginURL: req.protocol +'://'+ req.headers.host +'/',
        projectName: req.app.config.projectName
      },
      success: function(message) {
        workflow.emit('logUserIn');
      },
      error: function(err) {
        console.log('Error Sending Welcome Email: '+ err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function() {
    req._passport.instance.authenticate('local', function(err, user, info) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (!user) {
        workflow.outcome.errors.push('Login failed. That is strange.');
        return workflow.emit('response');
      }
      else {
        req.login(user, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
          workflow.emit('response');
        });
      }
    })(req, res);
  });

  workflow.emit('validate');
};

exports.signupVerification = function(req, res){

  console.log('signupVerification');

  
};

exports.signupTwitter = function(req, res, next) {
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }


    req.app.db.models.User.find({ where: { 'twitter.id': info.profile.id }}).then(function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Twitter account.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
    });
  })(req, res, next);
};

exports.signupGitHub = function(req, res, next) {
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    req.app.db.models.User.find({ where: { 'github.id': info.profile.id }}).then(function(err, user) {
      if (err) {
        return next(err);
      }

      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your GitHub account.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
    });
  })(req, res, next);
};

exports.signupFacebook = function(req, res, next) {
  req._passport.instance.authenticate('facebook', { callbackURL: '/api/v1/signup/facebook/callback/' }, function(err, user, info) {
    
    console.log('signupFacebook: err');
    console.dir(err);

    console.log('signupFacebook: user');
    console.dir(user);

    console.log('signupFacebook: info');
    console.dir(info);

    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    req.app.db.models.User.find({where: { 'facebook.id': info.profile.id }}).then(function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Facebook account.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
    });
  })(req, res, next);
};

exports.signupGoogle = function(req, res, next) {
  req._passport.instance.authenticate('google', { callbackURL: '/signup/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    req.app.db.models.User.find({ where: { 'google.id': info.profile.id }}).then(function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Google account.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
    });
  })(req, res, next);
};

exports.signupTumblr = function(req, res, next) {
  req._passport.instance.authenticate('tumblr', { callbackURL: '/signup/tumblr/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/signup/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.find({ where: { 'tumblr.id': info.profile.id }}).then(function(err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.session.socialProfile = info.profile;
        res.render('signup/social', { email: info.profile.emails && info.profile.emails[0].value || '' });
      }
      else {
        res.render('signup/index', {
          oauthMessage: 'We found a user linked to your Tumblr account.',
          oauthTwitter: !!req.app.config.oauth.twitter.key,
          oauthGitHub: !!req.app.config.oauth.github.key,
          oauthFacebook: !!req.app.config.oauth.facebook.key,
          oauthGoogle: !!req.app.config.oauth.google.key,
          oauthTumblr: !!req.app.config.oauth.tumblr.key
        });
      }
    });
  })(req, res, next);
};

exports.signupSocial = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.username) {
      workflow.outcome.errfor.username = 'required';
    }
    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
    }
    else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
      workflow.outcome.errfor.email = 'invalid email format';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('duplicateUsernameCheck');
  });

  workflow.on('duplicateUsernameCheck', function() {
    //workflow.username = req.session.socialProfile.username || req.session.socialProfile.id;
    //if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
    //  workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
    //}

    req.app.db.models.User.find({ where: { username: req.body.username } }).then(function(user) {


      if (user) {
        workflow.outcome.errfor.username = 'username already taken';
        return workflow.emit('response');
      }

      workflow.emit('duplicateEmailCheck');
    });
  });

  workflow.on('duplicateEmailCheck', function() {
    req.app.db.models.User.find({ where: { email: req.body.email.toLowerCase() } }).then(function(user) {

      if (user) {
        workflow.outcome.errfor.email = 'email already registered';
        return workflow.emit('response');
      }

      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
     req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }
      
      //we need to set a verification timeframe.. and role etc

      var fieldsToSet = {
        isActive: 'yes',
        isVerified: 'no',
        createdById: '0',
        username: req.body.username,
        email: req.body.email.toLowerCase(),
        password: hash,
        roles: '1,'
      };
      //fieldsToSet[req.session.socialProfile.provider] = { id: req.session.socialProfile.id };
      req.app.db.models.User.create(fieldsToSet).then(function(user) {
        if (!user) {
          return workflow.emit('exception', user);
        }

        workflow.outcome.userid = user.dataValues.id;
        workflow.outcome.username = user.dataValues.username;
        workflow.emit('sendWelcomeEmail');
      });
    });
    
  });

  workflow.on('sendWelcomeEmail', function() {
    req.app.utility.sendmail(req, res, {
      from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
      to: req.body.email,
      subject: 'Your '+ req.app.config.projectName +' Account',
      textPath: 'signup/email-text',
      htmlPath: 'signup/email-html',
      locals: {
        username: workflow.outcome.username,
        email: req.body.email,
        loginURL: req.protocol +'://'+ req.headers.host +'/login/',
        projectName: req.app.config.projectName
      },
      success: function(message) {
        workflow.emit('logUserIn');
      },
      error: function(err) {
        console.log('Error Sending Welcome Email: '+ err);
        workflow.emit('logUserIn');
      }
    });
  });

  workflow.on('logUserIn', function() {
    req.login(workflow.user, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }

      delete req.session.socialProfile;
      workflow.outcome.defaultReturnUrl = workflow.user.defaultReturnUrl();
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

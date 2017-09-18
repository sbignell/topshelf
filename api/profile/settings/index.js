'use strict';



exports.connectTwitter = function(req, res, next){
  req._passport.instance.authenticate('twitter', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/settings/');
    }

    req.app.db.models.User.findOne({ 'twitter.id': info.profile.id, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Twitter account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, { 'twitter.id': info.profile.id }, function(err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/settings/');
        });
      }
    });
  })(req, res, next);
};

exports.connectGitHub = function(req, res, next){
  req._passport.instance.authenticate('github', function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/settings/');
    }

    req.app.db.models.User.findOne({ 'github.id': info.profile.id, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that GitHub account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, { 'github.id': info.profile.id }, function(err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/settings/');
        });
      }
    });
  })(req, res, next);
};

exports.connectFacebook = function(req, res, next){
  req._passport.instance.authenticate('facebook', { callbackURL: '/account/settings/facebook/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/settings/');
    }

    req.app.db.models.User.findOne({ 'facebook.id': info.profile.id, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Facebook account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, { 'facebook.id': info.profile.id }, function(err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/settings/');
        });
      }
    });
  })(req, res, next);
};

exports.connectGoogle = function(req, res, next){
  req._passport.instance.authenticate('google', { callbackURL: '/account/settings/google/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/settings/');
    }

    req.app.db.models.User.findOne({ 'google.id': info.profile.id, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Google account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, { 'google.id': info.profile.id }, function(err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/settings/');
        });
      }
    });
  })(req, res, next);
};

exports.connectTumblr = function(req, res, next){
  req._passport.instance.authenticate('tumblr', { callbackURL: '/account/settings/tumblr/callback/' }, function(err, user, info) {
    if (!info || !info.profile) {
      return res.redirect('/account/settings/');
    }

    if (!info.profile.hasOwnProperty('id')) {
      info.profile.id = info.profile.username;
    }

    req.app.db.models.User.findOne({ 'tumblr.id': info.profile.id, _id: { $ne: req.user.id } }, function(err, user) {
      if (err) {
        return next(err);
      }

      if (user) {
        renderSettings(req, res, next, 'Another user has already connected with that Tumblr account.');
      }
      else {
        req.app.db.models.User.findByIdAndUpdate(req.user.id, { 'tumblr.id': info.profile.id }, function(err, user) {
          if (err) {
            return next(err);
          }

          res.redirect('/account/settings/');
        });
      }
    });
  })(req, res, next);
};

exports.disconnectTwitter = function(req, res, next){
  req.app.db.models.User.findByIdAndUpdate(req.user.id, { twitter: { id: undefined } }, function(err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/settings/');
  });
};

exports.disconnectGitHub = function(req, res, next){
  req.app.db.models.User.findByIdAndUpdate(req.user.id, { github: { id: undefined } }, function(err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/settings/');
  });
};

exports.disconnectFacebook = function(req, res, next){
  req.app.db.models.User.findByIdAndUpdate(req.user.id, { facebook: { id: undefined } }, function(err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/settings/');
  });
};

exports.disconnectGoogle = function(req, res, next){
  req.app.db.models.User.findByIdAndUpdate(req.user.id, { google: { id: undefined } }, function(err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/settings/');
  });
};

exports.disconnectTumblr = function(req, res, next){
  req.app.db.models.User.findByIdAndUpdate(req.user.id, { tumblr: { id: undefined } }, function(err, user) {
    if (err) {
      return next(err);
    }

    res.redirect('/account/settings/');
  });
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);
  //console.log('in profile > update');

  workflow.on('validate', function() {
    if (!req.body.firstname) {
      workflow.outcome.errfor.first = 'required';
    }

    if (!req.body.lastname) {
      workflow.outcome.errfor.last = 'required';
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function() {
    var fieldsToSet = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      groups: req.body.groups,
      phone: req.body.phone,
      twitterKey: req.body.twitterKey,
      facebookKey: req.body.facebookKey,
      googleKey: req.body.googleKey,
      githubKey: req.body.githubKey
    };
    

    req.app.db.models.User.find({ where: { id: req.body.id }}).then(function(user) {
      console.log('found user' + user.username);
      user.update(fieldsToSet).then(function(savedUser){
        console.log('saved.');
        workflow.outcome.user = savedUser;
        workflow.emit('response');
      })

    });
  });

  workflow.emit('validate');
};

exports.password = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.newPassword) {
      workflow.outcome.errfor.newPassword = 'required';
    }

    if (!req.body.confirm) {
      workflow.outcome.errfor.confirm = 'required';
    }

    if (req.body.newPassword !== req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('patchUser');
  });

  workflow.on('patchUser', function() {
    req.app.db.models.User.encryptPassword(req.body.newPassword, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      var fieldsToSet = { password: hash };
      req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        user.populate('roles.admin roles.account', 'name.full', function(err, user) {
          if (err) {
            return workflow.emit('exception', err);
          }

          workflow.outcome.newPassword = '';
          workflow.outcome.confirm = '';
          workflow.emit('response');
        });
      });
    });
  });

  workflow.emit('validate');
};

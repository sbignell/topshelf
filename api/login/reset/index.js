'use strict';

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/reset/index');
  }
};

exports.set = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.body.password) {
      workflow.outcome.errfor.password = 'required';
    }

    if (!req.body.confirm) {
      workflow.outcome.errfor.confirm = 'required';
    }

    if (req.body.password !== req.body.confirm) {
      workflow.outcome.errors.push('Passwords do not match.');
    }

    if (workflow.hasErrors()) {
      return workflow.emit('response');
    }

    workflow.emit('findUser');
  });

  var isonow = new Date();
  isonow = isonow.toISOString();

  workflow.on('findUser', function() {
    var conditions = {
      email: req.params.email,
      resetPasswordExpires: { $gt: isonow } //{ $gt: Date.now() }
    };
    req.app.db.models.User.findOne({
      where: conditions
    }).then(function(user) {
      /*if (err) {
        return workflow.emit('exception', err);
      }*/

      if (!user) {
        workflow.outcome.errors.push('Invalid request.');
        return workflow.emit('response');
      }

      console.dir(user);

      req.app.db.models.User.validatePassword(req.params.token, user.resetPasswordToken, function(err, isValid) {
        if (err) {
          return workflow.emit('exception', err);
        }

        console.dir(isValid);

        if (!isValid) {
          workflow.outcome.errors.push('Invalid request.');
          return workflow.emit('response');
        }

        workflow.emit('patchUser', user);
      });
    });
  });

  workflow.on('patchUser', function(user) {
    console.log('reached patchUser');
    req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
      if (err) {
        return workflow.emit('exception', err);
      }

      console.log('err: ' + err + ', hash: ' + hash);

      //var fieldsToSet = {  };

      user.updateAttributes({
        password: hash, 
        resetPasswordToken: ''
      }).then(function() {
        console.log('reset: user updated with resetpw fields');
        workflow.emit('response');
      });


      /*req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.emit('response');
      });*/
    });
  });

  workflow.emit('validate');
};

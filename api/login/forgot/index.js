'use strict';

exports.init = function(req, res){
  if (req.isAuthenticated()) {
    res.redirect(req.user.defaultReturnUrl());
  }
  else {
    res.render('login/forgot/index');
  }
};

exports.send = function(req, res, next){
  console.log('in send');
  
  //res.send('test');

  var workflow = req.app.utility.workflow(req, res);


  workflow.on('validate', function() {
    console.log('in validate');
    if (!req.body.email) {
      workflow.outcome.errfor.email = 'required';
      return workflow.emit('response');
    }

    workflow.emit('generateToken');
  });

  workflow.on('generateToken', function() {
    console.log('in generateToken');
    var crypto = require('crypto');
    crypto.randomBytes(21, function(err, buf) {
      if (err) {
        return next(err);
      }

      var token = buf.toString('hex');
      console.log('before encryptPW');
      req.app.db.models.User.encryptPassword(token, function(err, hash) {
        if (err) {
          return next(err);
        }
        //console.log('after encryptPW');
        workflow.emit('patchUser', token, hash);
      });
    });
  });

  workflow.on('patchUser', function(token, hash) {
    console.log('patchUser');
    var isotime = new Date();
    isotime.setHours(isotime.getHours() + 4);
    isotime = isotime.toISOString().slice(0, 19).replace('T', ' ');
    console.log('isotime: ' + isotime);
    console.log('token: ' + token + ', hash: ' + hash);

    var conditions = { email: req.body.email.toLowerCase() };
    var fieldsToSet = { 
      resetPasswordToken: hash,
      resetPasswordExpires: isotime //Date.now() + 10000000
    };

     req.app.db.models.User.findOne({
          where: conditions,
          attributes: ['id', 'email']
      }).then(function(user) {
          console.log('User returned.');
          console.dir(user);

          if (!user) {
            return workflow.emit('exception', 'couldn\'t find user');
          }

          /*user.set('resetPasswordToken', fieldsToSet.resetPasswordToken);
          user.set('resetPasswordExpires', fieldsToSet.resetPasswordExpires);
          user.save().then(function(){

            console.log('forgot: user updated with resetpw fields');
            workflow.emit('sendEmail', token, user);
          });*/

          user.update({//Attributes({
            resetPasswordToken: fieldsToSet.resetPasswordToken, 
            resetPasswordExpires: fieldsToSet.resetPasswordExpires
          }).then(function() {
            console.log('forgot: user updated with resetpw fields');
            workflow.emit('sendEmail', token, user);
          });

          //create Resetpassword record
          /*var resetPW = req.app.db.models.ResetPassword.build({
            userId: userId, 
            resetPasswordToken: fieldsToSet.resetPasswordToken, 
            resetPasswordExpires: fieldsToSet.resetPasswordExpires,
            isUsed: 'N',
          });

          // persist an instance
          resetPW.save()
            .error(function(err) {
              // error callback
              console.log('Couldnt save resetPassword: ' + err);
              return workflow.emit('exception', err);
            })
            .success(function(newResetPW) {
              // success callback
              console.log('Saved new ResetPW: ' + newResetPW.resetPasswordToken);

              workflow.emit('sendEmail', token, user);
              
            });*/
          
           

      });

  });

  workflow.on('sendEmail', function(token, user) {
    console.log('reached sendEmail, token is: ' + token);
    console.log(req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>');
    console.log(req.app.config.smtp.credentials.user + ', ' + req.app.config.smtp.credentials.host);
    req.app.utility.sendmail(req, res, {
      from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
      to: user.email,
      subject: 'Reset your '+ req.app.config.projectName +' password',
      textPath: 'login/forgot/email-text',
      htmlPath: 'login/forgot/email-html',
      locals: {
        username: user.username,
        resetLink: req.protocol +'://'+ req.headers.host +'?u=' + user.email + '&t=' + token, ///api/v1/login/reset/'+ user.email +'/'+ token +'/',
        projectName: req.app.config.projectName
      },
      success: function(message) {
        workflow.emit('response');
      },
      error: function(err) {
        workflow.outcome.errors.push('Error Sending: '+ err);
        workflow.emit('response');
      }
    });
  }); 

  workflow.emit('validate');

  
  
};


/*

*/
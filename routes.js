'use strict';

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log('ensureAuthenticated: false');
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

function ensureAdmin(req, res, next) {
  if (req.user.canPlayRoleOf('admin')) {
    return next();
  }
  console.log('ensureAdmin: false');
  res.redirect('/');
}

function ensureAccount(req, res, next) {
  if (req.user.canPlayRoleOf('account')) {
    if (req.app.config.requireAccountVerification) {
      if (req.user.roles.account.isVerified !== 'yes' && !/^\/account\/verification\//.test(req.url)) {
        return res.redirect('/account/verification/');
      }
    }
    return next();
  }
  console.log('ensureAccount: false');
  res.redirect('/');
}

exports = module.exports = function(app, passport) {

  //signup
  app.post('/api/v1/signup/', require('./api/signup/index').signup);
  app.post('/api/v1/signup/verify/', require('./api/signup/index').signupVerification);

  //social sign up
  /*
  app.post('/api/v1/signup/social/', require('./api/signup/index').signupSocial);
  app.get('/api/v1/signup/twitter/', passport.authenticate('twitter', { callbackURL: '/api/v1/signup/twitter/callback/' }));
  app.get('/api/v1/signup/twitter/callback/', require('./api/signup/index').signupTwitter);
  app.get('/api/v1/signup/github/', passport.authenticate('github', { callbackURL: '/api/v1/signup/github/callback/', scope: ['user:email'] }));
  app.get('/api/v1/signup/github/callback/', require('./api/signup/index').signupGitHub);
  app.get('/api/v1/signup/facebook/', passport.authenticate('facebook', { callbackURL: '/api/v1/signup/facebook/callback/', scope: ['email'] }));
  app.get('/api/v1/signup/facebook/callback/', require('./api/signup/index').signupFacebook);
  app.get('/api/v1/signup/google/', passport.authenticate('google', { callbackURL: '/api/v1/signup/google/callback/', scope: ['profile email'] }));
  app.get('/api/v1/signup/google/callback/', require('./api/signup/index').signupGoogle);
  app.get('/api/v1/signup/tumblr/', passport.authenticate('tumblr', { callbackURL: '/api/v1/signup/tumblr/callback/' }));
  app.get('/api/v1/signup/tumblr/callback/', require('./api/signup/index').signupTumblr);
  */

  //login/out
  app.post('/api/v1/login/', require('./api/login/index').login);
  app.post('/api/v1/login/forgot/', require('./api/login/forgot/index').send);
  app.get('/api/v1/login/reset/:email/:token/', require('./api/login/reset/index').init);
  app.put('/api/v1/login/reset/:email/:token/', require('./api/login/reset/index').set);
  app.get('/api/v1/logout/', require('./api/logout/index').init);
  app.get('/logout/', require('./api/logout/index').init);

  //Check if logged in and get user object
  app.get('/api/v1/user/', require('./api/login/index').check);
  app.put('/api/v1/user/', require('./api/profile/settings/index').update);

  //social login
  app.get('/api/v1/login/twitter/', passport.authenticate('twitter', { callbackURL: '/login/twitter/callback/' }));
  app.get('/api/v1/login/twitter/callback/', require('./api/login/index').loginTwitter);
  app.get('/api/v1/login/github/', passport.authenticate('github', { callbackURL: '/login/github/callback/' }));
  app.get('/api/v1/login/github/callback/', require('./api/login/index').loginGitHub);
  app.get('/api/v1/login/facebook/', passport.authenticate('facebook', { callbackURL: '/login/facebook/callback/' }));
  app.get('/api/v1/login/facebook/callback/', require('./api/login/index').loginFacebook);
  app.get('/api/v1/login/google/', passport.authenticate('google', { callbackURL: '/login/google/callback/', scope: ['profile email'] }));
  app.get('/api/v1/login/google/callback/', require('./api/login/index').loginGoogle);
  app.get('/api/v1/login/tumblr/', passport.authenticate('tumblr', { callbackURL: '/login/tumblr/callback/', scope: ['profile email'] }));
  app.get('/api/v1/login/tumblr/callback/', require('./api/login/index').loginTumblr);

  //admin
  app.all('/api/v1/admin*', ensureAuthenticated);
  app.all('/api/v1/admin*', ensureAdmin);
  //app.get('/api/v1/admin/', require('./api/admin/index').init);

  app.get('/api/v1/admin/totalwines/', require('./api/admin/index').allwines);

  //admin > users
  app.get('/api/v1/admin/users/', require('./api/admin/users/index').find);
  app.post('/api/v1/admin/users/', require('./api/admin/users/index').create);
  app.get('/api/v1/admin/users/:id/', require('./api/admin/users/index').read);
  app.put('/api/v1/admin/users/:id/', require('./api/admin/users/index').update);
  app.put('/api/v1/admin/users/:id/password/', require('./api/admin/users/index').password);
  app.put('/api/v1/admin/users/:id/role-admin/', require('./api/admin/users/index').linkAdmin);
  app.delete('/api/v1/admin/users/:id/role-admin/', require('./api/admin/users/index').unlinkAdmin);
  app.put('/api/v1/admin/users/:id/role-account/', require('./api/admin/users/index').linkAccount);
  app.delete('/api/v1/admin/users/:id/role-account/', require('./api/admin/users/index').unlinkAccount);
  app.delete('/api/v1/admin/users/:id/', require('./api/admin/users/index').delete);

  //profile
  //app.all('/api/v1/profile*', ensureAuthenticated);
  //app.all('/api/v1/profile*', ensureAccount);
  //app.get('/api/v1/profile/', require('./api/profile/index').init);

  //profile > settings
  //app.get('/api/v1/profile/settings/', require('./api/profile/settings/index').init);
  
  //app.put('/api/v1/profile/settings/identity/', require('./api/profile/settings/index').identity);
  //app.put('/api/v1/profile/settings/password/', require('./api/profile/settings/index').password);

  //profile > settings > social
  app.get('/api/v1/profile/settings/twitter/', passport.authenticate('twitter', { callbackURL: '/profile/settings/twitter/callback/' }));
  app.get('/api/v1/profile/settings/twitter/callback/', require('./api/profile/settings/index').connectTwitter);
  app.get('/profile/settings/twitter/disconnect/', require('./api/profile/settings/index').disconnectTwitter);
  app.get('/api/v1/profile/settings/github/', passport.authenticate('github', { callbackURL: '/profile/settings/github/callback/' }));
  app.get('/api/v1/profile/settings/github/callback/', require('./api/profile/settings/index').connectGitHub);
  app.get('/api/v1/profile/settings/github/disconnect/', require('./api/profile/settings/index').disconnectGitHub);
  app.get('/api/v1/profile/settings/facebook/', passport.authenticate('facebook', { callbackURL: '/profile/settings/facebook/callback/' }));
  app.get('/api/v1/profile/settings/facebook/callback/', require('./api/profile/settings/index').connectFacebook);
  app.get('/api/v1/profile/settings/facebook/disconnect/', require('./api/profile/settings/index').disconnectFacebook);
  app.get('/api/v1/profile/settings/google/', passport.authenticate('google', { callbackURL: '/profile/settings/google/callback/', scope: ['profile email'] }));
  app.get('/api/v1/profile/settings/google/callback/', require('./api/profile/settings/index').connectGoogle);
  app.get('/api/v1/profile/settings/google/disconnect/', require('./api/profile/settings/index').disconnectGoogle);
  app.get('/api/v1/profile/settings/tumblr/', passport.authenticate('tumblr', { callbackURL: '/profile/settings/tumblr/callback/' }));
  app.get('/api/v1/profile/settings/tumblr/callback/', require('./api/profile/settings/index').connectTumblr);
  app.get('/api/v1/profile/settings/tumblr/disconnect/', require('./api/profile/settings/index').disconnectTumblr);

  //Wine app
  app.get('/api/v1/cellar/', require('./api/cellar/index').find);
  app.post('/api/v1/cellar/', require('./api/cellar/index').create);
  app.put('/api/v1/cellar/:id', require('./api/cellar/index').update);
  app.delete('/api/v1/cellar/:id', require('./api/cellar/index').delete);
  app.get('/api/v1/cellar/:id', require('./api/cellar/index').findOne);

  //route not found
  app.all('*', require('./api/http/index').http404);
};

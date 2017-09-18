'use strict';

//dependencies
var config = require('./config'),
    express = require('express'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    SessionStore = require('express-mysql-session'),
    Sequelize = require('sequelize'),
    //fs = require('fs'),
    //log = require('log'),
    http = require('http'),
    //https = require('https'),
    path = require('path'),
    passport = require('passport'),
    helmet = require('helmet'),
    csrf = require('csurf');

//create express app
var app = express();

//keep reference to config
app.config = config;

/*   For HTTPS web server
//var options = {
//    key: fs.readFileSync(config.ssl.key),
//    cert: fs.readFileSync(config.ssl.cert)
//};

//app.server = https.createServer(options, app);

*/

// For HTTP web server
app.server = http.createServer(app);
app.db = {};


//setup sequelize
var sqlstring = 'mysql://' + config.mysql.username + ':' + config.mysql.password + '@' + config.mysql.host + ':' + config.mysql.port + '/' + config.mysql.db;
//console.log(sqlstring);

var sequelize = new Sequelize(sqlstring);

//connect to mysql
sequelize
.authenticate()
.then(function(err) {
  if (!!err) {
    console.log('Sequelize_MySQL: Unable to connect to the database. ' + err);
  } else {
    console.log('Sequelize_MySQL: Connection has been established successfully.');
    
  }
});

//config relational (mysql) data models
require('./rdbms-models')(app, sequelize);

//config session store in mysql
var sessionStore = new SessionStore({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.db
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


//settings
app.disable('x-powered-by');
app.set('port', config.port);
app.set('views', path.join(__dirname, 'api')); //once we only send data does this go away? Needed for emails in login/forgot
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'client')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cryptoKey));
app.use(session({
  key: 'h3ll0',
  secret: config.cryptoKey,
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(csrf({ cookie: { signed: true } }));
helmet(app);

//response locals
app.use(function(req, res, next) {
  res.cookie('_csrfToken', req.csrfToken());
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./passport')(app, passport);

//setup routes
require('./routes')(app, passport);

//custom (friendly) error handler
app.use(require('./api/http/index').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./util/sendmail');
app.utility.slugify = require('./util/slugify');
app.utility.workflow = require('./util/workflow');

//listen up
app.server.listen(app.config.port, function(){
  //and... we're live
  console.log(config.projectName + ' is live.');
});

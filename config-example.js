'use strict';

exports.port = process.env.PORT || 3001;
exports.companyName = 'sid and sven';
exports.projectName = 'sid';
exports.systemEmail = 'your@email.addy';
exports.cryptoKey = 'c@B3rnet5auv1gn0n!!';
exports.loginAttempts = {
  forIp: 50,
  forIpAndUser: 7,
  logExpiration: '20' //in min
};
exports.requireAccountVerification = false;
exports.ssl = {
  key: '/home/user/yourkey.pem',
  cert: '/home/user/yourcrt.pem'
};
exports.smtp = {
  from: {
    name: process.env.SMTP_FROM_NAME || exports.projectName,
    address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
  },
  credentials: {
    user: process.env.SMTP_USERNAME || 'your@email.addy',
    password: process.env.SMTP_PASSWORD || 'changethis',
    host: process.env.SMTP_HOST || 'your.webmail.server',
    ssl: true
  }
};
exports.mysql = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || '3306',
  db: process.env.DB || 'sidandsven',
  username: process.env.MYSQL_USERNAME || 'sid',
  password: process.env.MYSQL_PASSWORD || 'malbec'
};
exports.oauth = {
  twitter: {
    key: process.env.TWITTER_OAUTH_KEY || '',
    secret: process.env.TWITTER_OAUTH_SECRET || ''
  },
  facebook: {
    key: process.env.FACEBOOK_OAUTH_KEY || '',
    secret: process.env.FACEBOOK_OAUTH_SECRET || ''
  },
  github: {
    key: process.env.GITHUB_OAUTH_KEY || '',
    secret: process.env.GITHUB_OAUTH_SECRET || ''
  },
  google: {
    key: process.env.GOOGLE_OAUTH_KEY || '',
    secret: process.env.GOOGLE_OAUTH_SECRET || ''
  },
  tumblr: {
    key: process.env.TUMBLR_OAUTH_KEY || '',
    secret: process.env.TUMBLR_OAUTH_SECRET || ''
  }
};

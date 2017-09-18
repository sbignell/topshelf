'use strict';

exports = module.exports = function(app, sequelize) {

  app.db.models = {};

  app.db.models.User = sequelize.import(__dirname + '/rdbms-schema/User');
  app.db.models.Role = sequelize.import(__dirname + '/rdbms-schema/Role');
  app.db.models.Group = sequelize.import(__dirname + '/rdbms-schema/Group');
  app.db.models.LoginAttempt = sequelize.import(__dirname + '/rdbms-schema/LoginAttempt');
  app.db.models.Wine = sequelize.import(__dirname + '/rdbms-schema/Wine');

};
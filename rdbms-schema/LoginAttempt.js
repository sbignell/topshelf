'use strict';

exports = module.exports = function(sequelize, DataTypes) {
  var LoginAttempt = sequelize.define('LoginAttempt', { 	
    id: { type: Number, default: '', primaryKey: true, autoIncrement: true },
    ip: { type: String, default: '' },
    userId: { type: Number, default: '' },
    time: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  

  return LoginAttempt;
};

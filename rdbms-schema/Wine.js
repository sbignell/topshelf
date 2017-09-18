'use strict';

exports = module.exports = function(sequelize, DataTypes) {
  var Wine = sequelize.define('Wine', { 
    id: { type: Number, default: '', primaryKey: true, autoIncrement: true },
    grape: { type: String, default: '' },
    estate: { type: String, default: '' },
    name: { type: String, default: '' },
    notes: { type: String, default: '' },
    rating: { type: String, default: '' },
    createdById: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
 
  //return Wine;
  return Wine;

};
'use strict';

exports = module.exports = function(sequelize, DataTypes) {
  var Cellar = sequelize.define('Cellar', { 
    id: { type: Number, default: '', primaryKey: true, autoIncrement: true },
    cellarName: { type: String, default: '' },
    physicalAddress: { type: String, default: '' },
    capacity: { type: String, default: '' },
    modelName: { type: String, default: '' },
    modelNumber: { type: Date, default: Date.now },
    manufacturer: { type: Date, default: Date.now }
    //loc1 - dynamically add?
    //loc2 
    //etc
  });
 
  return Cellar;

};
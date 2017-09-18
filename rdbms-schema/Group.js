'use strict';

exports = module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('Group', { 	
    id: { type: Number, default: '', primaryKey: true, autoIncrement: true },
    name: { type: String, default: '' },
    company: { type: Number, default: '' },
    createdById: { type: Number, default: '' },
    createdByName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  //adminGroupSchema.plugin(require('./plugins/pagedFind'));

  return Group;
};

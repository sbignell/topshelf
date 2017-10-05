'use strict';

exports = module.exports = function(sequelize, DataTypes) {
  var Wine = sequelize.define('Wine', { 
    id: { type: Number, default: '', primaryKey: true, autoIncrement: true },
    varietal: { type: String, default: '' }, //grape
    producer: { type: String, default: '' }, //estate
    wineName: { type: String, default: '' },
    vintage: { type: String, default: '' },
    myNotes: { type: String, default: '' },
    myRating: { type: String, default: '' },
    commonRating: { type: String, default: '' }, //from reputable review company
    commonNotes: { type: String, default: '' }, //actually an array of others' notes
    producerNotes: { type: String, default: '' },
    wineLabel: { type: String, default: '' },
    wineRRP: { type: String, default: '' },
    quantity: { type: String, default: '' },
    countryOfOrigin: { type: String, default: '' },
    regionOfOrigin: { type: String, default: '' },
    wineAwards: { type: String, default: '' }, 
    createdById: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
 
  return Wine;

};
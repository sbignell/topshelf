'use strict';

/*exports.init = function(req, res, next){
  var sigma = {};
  var collections = ['User'];
  var queries = [];

  collections.forEach(function(el, i, arr) {
    queries.push(function(done) {
      req.app.db.models[el].count({}, function(err, count) {
        if (err) {
          return done(err, null);
        }

        sigma['count'+ el] = count;
        done(null, el);
      });
    });
  });

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    res.render('admin/index', sigma);
  };

  require('async').parallel(queries, asyncFinally);
};*/

exports.allwines = function(req, res, next){

req.app.db.models.Wine.findAll({
      attributes: ['id', 'myRating', 'createdById']
   }).then(function(items) {
    
      console.log('Items returned.');
      //console.dir(items);
      
      var results = JSON.stringify(items.length);

      if (req.xhr) {

        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        console.log('sending xhr: ');
        //console.dir(outcome.results);
        res.send(results);
      }
      else {
        //?
      }
 
  });

};

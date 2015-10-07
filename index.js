'use strict';
var _ = require('lodash');
exports.register = function(server, options, next) {
  // option to change the endpoint:
  let endpoint = options.endpoint ? options.endpoint : '/methods'
  // option to overload the logging method:
  let log = options.log ? options.log : function log(loggedMessage){
    console.log(loggedMessage);
  }
  // optional blocklisting function that checks if this request
  // should be able to call this method:
  let blocklist = options.blocklist ? options.blocklist : function(methodName, request){
    // by default we always allow access:
    return true;
  }
  // you can pass it a validator function
  let validator = options.validator ? options.validator : function(params){
    return params;
  }
  log("methodsRoutePlugin is exporting the following methods at :" + endpoint);
  _.each(_.keys(server.methods), function(method){
    log(method);
  })
  function parseBoolean(param){
    if ("true".match(param.toLowerCase())) return true;
    if ("false".match(param.toLowerCase())) return false;
    return undefined
  }
  // will extract/convert the parameters and add the 'done' handler for us
  function extractParamsFromRequest(request, done){
   let params = _.map(request.params.params.split("/"), function(param){
     return encodeURIComponent(param);
   });
   params.push(done);
   return params;
  }
  function getMethodFromServerWithNamespace(server, methodName){
    if (methodName.indexOf(".")>-1){
      var fields = methodName.split(".");
      return server.methods[_.first(fields)][_.last(fields)];
    }
    return server.methods[methodName];
  }

  log("methodsRoutePlugin is setting up a route at : " + endpoint);
  server.route({
      method: 'GET',
      path: endpoint + '/{methodName}/{params*}',
      handler: function (request, reply) {
        let methodName = encodeURIComponent(request.params.methodName);
        if (!blocklist(methodName, request)){
          reply(`<h1> 403 Error </h1> <br> You do not have access to ${methodName} `).code(403)
          return;
        }
        let params = extractParamsFromRequest(request, function done(err,result){
           if (err){
             log(err);
             reply(`<h1> Failure! </h1> <br> Method name ${methodName} threw this error: : ${err} `);
             return;
           }
           log(methodName + " returned successful, result was : " + result);
           reply(`<h1> Success! </h1> <br> Method name ${methodName} returns: ${result} `);
           return result;
        });
        params = validator(params);
        if (params==undefined){
          reply('<h1> 404 Error </h1> <br> Unable to validate parameters for method ' + methodName).code(404);
          return;
        }
        log("Called Method Name " + methodName);
        log("Called with params: " + params.toString())
        let method = getMethodFromServerWithNamespace(server, methodName);
        if (!method){
          reply('<h1> 404 Error </h1> <br> Method name ' + methodName + " does not exist ").code(404);
          return;
        }
        if (method.length != params.length){
          reply('<h1> 404 Error </h1> <br> Method name ' + methodName + " takes " + (method.length-1) + " parameters ").code(404);
          return;
        }
        try{
          method.apply(null, params);
          return;
        }catch(exc){
          log(exc);
          reply('<h1> 404 Error </h1> <br> Method name ' + methodName + " failed. <br> Error: <br> " + exc).code(404);
          return;
        }
      }
  });
  next();
}
exports.register.attributes = {
    pkg: require('./package.json')
};

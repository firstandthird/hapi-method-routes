'use strict';
var _ = require('lodash');

var defaults = {
  // option to change the endpoint:
  endpoint : '/methods',
  // optional whitelist function to screen requests to a method:
  whitelist : function(methodName, request){
    // by default we always allow access:
    return true;
  },
  //  you can pass it a validator function
  validator : function(params){
    return params;
  }
}

exports.register = function(server, options, next) {
  // setup defaults:
  var settings = _.clone(options);
  settings = _.defaults(settings, defaults);
  var endpoint = settings.endpoint;
  // you can pass your own logging function as options.log
  // by default we use hapi's default logging and tag it to this plugin,
  var log = settings.log ? settings.log : function log(message, tags){
    var logTags = ['hapi-method-routes'];
    // will push/combine any custom tags you want to add to the default tag:
    if (_.isArray(tags)) logTags = _.union(logTags, tags);
    if (_.isString(tags)) logTags.push(tags);
    console.log("TAGS: %s MESSAGE: %s", logTags, message);
    server.log(logTags, { message: message })
  }
  var whitelist = settings.whitelist;
  var validator = settings.validator;
  // list the methods we're exporting:
  log("methodsRoutePlugin is exporting the following methods at :" + endpoint);
  _.each(_.keys(server.methods), function(method){
    log(method, 'info');
  });

  // call this to extra params from request by GET or POST:
  // note: I think we're mainly wanting to support JSON/POST requests
  function extractParamsFromRequest(request){
    console.log(request.method)
    if (request.method.toLowerCase()=='post'){
      log("using POST/JSON method ")
      log(request.payload)
      var params = _.map(request.payload.values, function(param){
        return decodeURIComponent(param);
      });
      return params;
    }
    else return extractParamsFromRequestGET(request);
  }
  // helper that is called by extractParamsFromRequest for GET requests:
  // if you pass in a JSON package with 'values' it uses that
  // otherwise it tries to extract params directly from the url path:
  function extractParamsFromRequestGET(request){
   log("using GET/url params method")
   // gets empty array if params is undefined
   var params = (!request.params.params) ? [] : _.map(request.params.params.split("/"), function(param){
     return decodeURIComponent(param);
   });
   return params;
  }

  // helper functions to reply to a request,
  // depending on the preferred return method
  function replyAsHTML( failureCode, response, reply){
    if (failureCode)
      reply(`<h1>${failureCode}</h1> <br> ${response}`).code(failureCode);
    else
      reply(`<h1>Successful!<h1> <br> Result is: ${response}`);
  }
  function replyAsJSON(failureCode, response, reply){
    if (failureCode)
      reply({statusCode:failureCode, error: "Method Call Failed", message: response}).code(failureCode);
    else
      reply({successful: true, result: response})
  }
  // change this to switch the reply method from JSON to HTML
  // by default we're responding with JSON:
  var replyHandler = replyAsJSON; // replyAsHTML;

  log("methodsRoutePlugin is setting up a route at : " + endpoint);
  server.route({
      method: '*',
      path: endpoint + '/{methodName}/{params*}',
      handler: function (request, reply) {
        // get the method they are trying to call:
        var methodName = decodeURIComponent(request.params.methodName);
        // this goes at the top because we want to short-circuit if they don't have access
        // to the indicated method:
        if (!whitelist(methodName, request)){
          replyHandler(403, `You do not have access to ${methodName} `, reply);
          return;
        }
        log("Called Method Name " + methodName, 'debug');
        // extract and validate any params:
        var params = extractParamsFromRequest(request);
        params = validator(params);
        var method = _.get(server.methods, methodName);

        // first we're going to check for obvious errors:
        if (params==undefined){
          replyHandler(404, 'Unable to validate parameters for method ' + methodName, reply);
          return;
        }
        log("Called with params: " + params.toString(), 'debug');
        if (!method){
          replyHandler(404, `Method name ${methodName} does not exist `, reply);
          return;
        }
        if (method.length-1 != params.length){
          replyHandler(404, `Method name ${methodName}  takes  ${method.length} parameters `, reply);
          return;
        }
        // add the 'done' callback to the function params
        // this is the method that will be called at the end of the method execution:
        params.push(function done(err,result){
           if (err){
             log(err);
             replyHandler(500, `Method name ${methodName} threw this error: : ${err} `, reply)
           }
           else{
             log(methodName + " returned successful, result was : " + result, 'debug');
             replyHandler(null, result, reply);
           }
        });
        // finally we try to execute the method:
        try{
          method.apply(null, params);
        }catch(exc){
          log(exc);
          replyHandler(404, `Method name ${methodName} failed. Error: ${exc}`, reply);
          return;
        }
      }
  });
  next();
}
exports.register.attributes = {
    pkg: require('./package.json')
};

'use strict';
const _ = require('lodash');
const str2fn = require('str2fn');

const defaults = {
  // option to change the endpoint:
  endpoint: '/methods',
  auth: null,
  // optional whitelist function to screen requests to a method:
  whitelist(methodName, request) {
    // by default we always allow access:
    return true;
  },
  //  you can pass it a validator function
  validator(params) {
    return params;
  }
};

exports.register = (server, options, next) => {
  // setup defaults:
  const settings = Object.assign({}, defaults, options);
  const endpoint = settings.endpoint;
  const whitelist = settings.whitelist;
  const validator = settings.validator;
  // list the methods we're exporting:
  server.log(['hapi-method-routes', 'info'], `methodsRoutePlugin is exporting the following methods at : ${endpoint}`);

  // will decode any parameter list:
  const decodeParamList = (paramList) => _.map(paramList, (param) => decodeURIComponent(param));
  // call this to extra params from request by GET or POST:
  // note: I think we're mainly wanting to support JSON/POST requests
  const extractParamsFromRequest = (request) => {
    if (request.method.toLowerCase() === 'post') {
      return decodeParamList(request.payload.values);
    }
    return (!request.params.params) ? [] : decodeParamList(request.params.params.split('/'));
  };
  server.route({
    method: '*',
    path: `${endpoint}/{methodName}/{params*}`,
    config: {
      auth: settings.auth
    },
    handler(request, reply) {
      // get the method they are trying to call:
      const methodName = decodeURIComponent(request.params.methodName);
      // this goes at the top because we want to short-circuit if they don't have access
      // to the indicated method:
      if (!whitelist(methodName, request)) {
        reply({ successful: false, result: `You do not have access to ${methodName}` }).code(550);
        return;
      }
      // extract and validate any params:
      let params = extractParamsFromRequest(request);
      params = validator(params);
      const method = _.get(server.methods, methodName);

      // first we're going to check for obvious errors:
      if (params === undefined) {
        reply({ successful: false, result: `Unable to validate parameters for method ${methodName}` }).code(500);
        return;
      }
      if (!method) {
        reply({ successful: false, result: `Method name ${methodName} does not exist ` }).code(404);
        return;
      }
      // add the 'done' callback to the function params
      // this is the method that will be called at the end of the method execution:
      params.push((err, result) => {
        if (err) {
          reply({ successful: false, result: `Method name ${methodName} threw this error: ${err}` }).code(500);
        } else {
          reply({ successful: true, result });
        }
      });
      // finally we try to execute the method:
      try {
        method.apply(null, params);
      } catch (exc) {
        server.log(['hapi-method-routes', 'error'], exc);
        return reply(`Method name ${methodName} failed. Error: ${exc}`).code(404);
      }
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

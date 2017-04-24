'use strict';
const str2fn = require('str2fn');

const defaults = {
  // option to change the endpoint:
  endpoint: '/methods',
  auth: null,
  // optional whitelist function to screen requests to a method:
  whitelist(methodName, request) {
    // by default we always allow access:
    return true;
  }
};

exports.register = (server, options, next) => {
  // setup defaults:
  const settings = Object.assign({}, defaults, options);
  const endpoint = settings.endpoint;
  const whitelist = settings.whitelist;
  server.route({
    method: 'POST',
    path: `${endpoint}/{methodName}/{params*}`,
    config: {
      auth: settings.auth
    },
    handler(request, reply) {
      // determine the name of the method they are trying to call:
      const methodName = typeof request.payload.method === 'string' ? request.payload.method : decodeURIComponent(request.params.methodName);
      // stop them if they don't have access to the indicated method:
      if (!whitelist(methodName, request)) {
        return reply({ successful: false, result: `You do not have access to ${methodName}` }).code(550);
      }
      const method = str2fn(server.methods, methodName, () => reply({ successful: false, result: `Method name ${methodName} does not exist ` }).code(404));
      const params = request.payload.values || request.params.params || [];
      params.push((err, result) => {
        if (err !== null) {
          reply({ successful: false, result: `Method name ${methodName} threw this error: ${err}` }).code(500);
        } else {
          reply({ successful: true, result });
        }
      });
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

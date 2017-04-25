'use strict';
const str2fn = require('str2fn');

const defaults = {
  // option to change the endpoint:
  endpoint: '/methods',
  auth: null
};

exports.register = (server, options, next) => {
  // setup defaults:
  const settings = Object.assign({}, defaults, options);
  const endpoint = settings.endpoint;
  server.route({
    method: 'POST',
    path: `${endpoint}`,
    config: {
      auth: settings.auth
    },
    handler(request, reply) {
      str2fn.execute(request.payload.method, server.methods, {}, (err, result) => {
        if (err !== null) {
          if (err.toString().indexOf('does not exist') > -1) {
            return reply({ successful: false, result: `Method call ${request.payload.method} invokes a method that is not defined` }).code(404);
          }
          return reply({ successful: false, result: `Method call ${request.payload.method} threw this error: ${err}` }).code(500);
        }
        return reply({ successful: true, result });
      });
    }
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

'use strict';
const tap = require('tap');
const Hapi = require('hapi');
const routeModule = require('../index.js');

let server;

tap.beforeEach((done) => {
  server = new Hapi.Server({
    debug: {
      log: ['info', 'error']
    },
  });
  server.connection({ port: 3000 });
  server.register(
    {
      register: routeModule,
      options: {}
    }, () => {
    server.start(done);
  });
});
tap.afterEach((done) => {
  server.stop(done);
});

tap.test('lets you register a method with the server and call it as a route', (t) => {
  server.method('add', (a, b, done) => done(null, a.toString() + b.toString()), {});
  server.inject({
    url: '/methods/add',
    method: 'POST',
    payload: {
      values: [20, 25]
    }
  }, response => {
    t.equal(response.statusCode, 200);
    t.equal(response.result.successful, true);
    t.equal(response.result.result, '2025');
    t.end();
  });
});

tap.test('lets you register a sub-document method with the server and call it as a route', (t) => {
  server.method('math.add', (a, b, done) => {
    try {
      const floatA = parseFloat(a);
      const floatB = parseFloat(b);
      return done(null, floatA + floatB);
    } catch (exc) {
      return done(exc);
    }
  }, {});
  server.inject({
    url: '/methods/math.add',
    method: 'POST',
    payload: {
      values: [20, 25]
    }
  }, response => {
    t.equal(response.statusCode, 200);
    t.equal(response.result.successful, true);
    t.equal(response.result.result, 45);
    t.end();
  });
});

tap.test('returns 404 when wrong number of parameters is passed', (t) => {
  server.method('add', (a, b, done) => done(null, a + b), {});
  server.inject({
    url: '/methods/add',
    method: 'POST',
    payload: {
    }
  }, response => {
    t.equal(response.statusCode, 404);
    t.end();
  });
});

tap.test('return 404 when you call a method that does not exist', (t) => {
  server.inject({
    url: '/methods/math.add',
    method: 'POST',
    payload: {
      values: [20, 25]
    }
  }, response => {
    t.equal(response.statusCode, 404);
    t.end();
  });
});

tap.test('lets you specify the method to call inside a POST payload', (t) => {
  server.method('add', (a, b, done) => done(null, a.toString() + b.toString()), {});
  server.inject({
    url: '/methods/',
    method: 'POST',
    payload: {
      method: 'add',
      values: [20, 25]
    }
  }, response => {
    t.equal(response.statusCode, 200);
    t.equal(response.result.successful, true);
    t.equal(response.result.result, '2025');
    t.end();
  });
});

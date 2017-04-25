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
    url: '/methods',
    method: 'POST',
    payload: {
      method: 'add(20, 25)'
    }
  }, response => {
    t.equal(response.statusCode, 200);
    t.equal(response.result.successful, true);
    t.equal(response.result.result, '2025');
    t.end();
  });
});

tap.test('lets you expose a sub-document method with the server and call it as a route', (t) => {
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
    url: '/methods',
    method: 'POST',
    payload: {
      method: 'math.add(20, 25)'
    }
  }, response => {
    t.equal(response.statusCode, 200);
    t.equal(response.result.successful, true);
    t.equal(response.result.result, 45);
    t.end();
  });
});
tap.test('returns 500 when wrong number of parameters is passed', (t) => {
  server.method('add', (a, b, done) => done(null, a + b), {});
  server.inject({
    url: '/methods',
    method: 'POST',
    payload: {
      method: 'add()'
    }
  }, response => {
    t.equal(response.statusCode, 500);
    t.end();
  });
});

tap.test('return 404 when you call a method that does not exist', (t) => {
  server.inject({
    url: '/methods',
    method: 'POST',
    payload: {
      method: 'add(20, 25)'
    }
  }, response => {
    t.equal(response.statusCode, 404);
    t.equal(response.result.successful, false);
    t.equal(response.result.result, 'Method call add(20, 25) invokes a method that is not defined');
    t.end();
  });
});

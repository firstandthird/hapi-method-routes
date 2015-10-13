"use strict"
var _ = require("lodash");
var Hapi = require("hapi");
var routeModule = require("../index.js");
var request = require("request");
var fs = require("fs");

// an example of a method to export. the last param of your method will be a 'done' callback
// who's first param is any error message and second is the output of the method
function add(a, b, done){
  var result = a+b;
  done(null, result);
}

// another example, this one will be added to server.method.math
// to demonstrate how methods can be namespaced:
function mathAdd(a,b,done){
  try{
    var floatA = parseFloat(a);
    var floatB = parseFloat(b);
    var result = floatA + floatB;
    done(null,result);
  }catch(exc){
    done(exc);
  }
}

var samplePayload = { "values" : [20,25]};

var server = new Hapi.Server();

// here is how you register your methods for export:
server.method('add', add);
server.method('math.add', mathAdd)
server.connection({ port: 3000 });
server.register(
  {
    register : routeModule,
    options : {
    }
  },
  function(err){
    server.log("module registered")
    if (err) {
      console.log(err);
      server.log(err);
    }
    else
      server.start(function () {
        console.log('Server running at: %s, beginning tests...', server.info.uri);
        // test the method:
        request({
            url: 'http://localhost:3000/methods/add', //URL to hit
            method: 'POST',
            //Lets post the following key/values as form
            json: samplePayload
        }, function(error, response, body){
            if(error)
                console.log(error);
            else if (body.successful)
              console.log("add, result should be '2025': %s", body.result);
            else
              console.log("add did not succeed, result was : %s", response.statusCode, body.result);
        });
        // test namespace method:
        request({
            url: 'http://localhost:3000/methods/math.add', //URL to hit
            method: 'POST',
            //Lets post the following key/values as form
            json: samplePayload
        }, function(error, response, body){
            if(error)
              console.log(error);
            else if (body.successful)
              console.log("math.add result should be 45:  %s", body.result);
            else
              console.log("math.add did not succeed, result was : %s %s", response.statusCode, body.result);
        });
        // test calling a method that doesn't exist:
        request({
            url: 'http://localhost:3000/methods/math.doesntexist', //URL to hit
            method: 'POST',
            json: samplePayload,
        }, function(error, response, body){
            if(error) {
              console.log(error);
            } else {
              console.log("Unavailable method should return 404: doesn't exist: ", response.statusCode, body.result);
            }
        });
        // test calling a method with no parameters
        request({
            url: 'http://localhost:3000/methods/math.add', //URL to hit
            method: 'POST',
            json: {},
        }, function(error, response, body){
            if(error)
              console.log(error);
            else
              console.log("empty json should throw an error: ", response.statusCode, body.result);
        });

    });
  }
);

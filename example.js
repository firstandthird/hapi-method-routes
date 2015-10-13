"use strict"
var _ = require("lodash");
var Hapi = require("hapi");
var routeModule = require("methodsRoutePlugin")

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

var server = new Hapi.Server();

// a default log method:

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
    console.log("module registered")
    if (err) {
      console.log(err)
    }
    else
      server.start(function () {
          console.log('Server running at:', server.info.uri);
      });
  }
);

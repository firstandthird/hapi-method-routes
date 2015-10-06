`hapi-method-routes` is a hapi plugin that exposes server methods via routes

## Requirements
* `/methods/{name}` should call that method and reply with it's results
* `/methods/` endpoint is the default, but can be overridden with plugin options
* the route should be able to take arguments that are passed into the method - you need to figure out the best way to handle this
* should return a 404 if the method doesn't exist
* should return an error response if the method returns an error
* namespaced server methods (`some.method`) should be supported

## Example Method

```js
server.method('add', function(a, b, done) {
  var result = a + b;
  done(null, result);
});
```
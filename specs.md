`hapi-method-routes` is a hapi plugin that exposes server methods via routes

## Requirements
* x`/methods/` endpoint is the default, but can be overridden with plugin options
* x`/methods/{name}` should call that method and reply with it's results
* xthe route should be able to take arguments that are passed into the method - you need to figure out the best way to handle this
* xshould return a 404 if the method doesn't exist
* xshould return an error response if the method returns an error
* xnamespaced server methods (`some.method`) should be supported

## Example Method

```js
server.method('add', function(a, b, done) {
  var result = a + b;
  done(null, result);
});
```

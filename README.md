#hapi-method-routes is a plugin that exposes server methods as routes

## Example:
```js
server.method('add', (a, b, done) => done(null, a.toString() + b.toString()), {});
server.inject({
  url: '/methods/',
  method: 'POST',
  payload: {
    method: 'add',
    values: [20, 25]
  }
}, response => {
  console.log(response.result.successful);
  console.log(response.result.result);
});
```

   will print 'true' and '2025'.  See tests for more examples.

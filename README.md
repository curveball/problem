Curveball Problem Middleware
===========================

This package is a middleware for the [Curveball][2] framework that catches any
exception and turns them into `application/problem+json` responses, as defined
in [RFC7807][1].

By default any exception turns into a non-descript 500 Internal Server Error.
To create a more specific error, use an exception from the
[@curveball/http-errors][3] package or implement one of the interfaces.

Installation
------------

    npm install @curveball/problem


Getting started
---------------

```typescript
import problemMw from '@curveball/problem';
import { Application } from '@curveball/core';

const app = new Application();
app.use(problemMw());
```

Typically you will want the problem middleware to be one of the first
middlewares you add to the server. Only exceptions from midddlewares that come
after the problem middleware can be caught.

### Debug mode

By default the middleware will emit a detailed error for any exception that
implements the [http-errors][3] interfaces, because the assumption is that
if these errors were emitted, they were intended for the user of the server.

Any exceptions that are thrown that don't implement these interfaces are
stripped from their message and detail and converted to a 500 error to avoid
potential security issues.

It's possible to turn this off during development in two ways. You can set
the debug setting to true as such:

```typescript
app.use(problemMw({
  debug: true
});
```

The second way is by setting the environemnt variable `NODE_ENV` to the string
`development`.

If the `debug` property is set, that value always takes precedent.

[1]: https://tools.ietf.org/html/rfc7807
[2]: https://github.com/curveballjs/
[3]: https://github.com/curveballjs/http-errors


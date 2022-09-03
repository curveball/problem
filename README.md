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
import { Application } from '@curveball/kernel';

const app = new Application();
app.use(problemMw());
```

Typically you will want the problem middleware to be one of the first
middlewares you add to the server. Only exceptions from midddlewares that come
after the problem middleware can be caught.


### Throwing errors

You can throw the following kinds of errors.

* Standard errors. These errors will be anonimized and logged to the console.
  a http 500 error gets emitted. (unless debug mode is on).
* Errors with a `httpStatus` property. Any error that's thrown that has a
  `httpStatus` property will automatically use that http status. The error
  message will be used as a title.
* An error from the [http-errors][3] package.


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

### Quiet mode

If quiet mode is enabled, 4XX errors are not logged. Client errors are common
and usually expected behavior, so it might be preferable for them to not spam
the log.

```typescript
app.use(problemMw({
  quiet: true
});
```


[1]: https://tools.ietf.org/html/rfc7807
[2]: https://github.com/curveball/
[3]: https://github.com/curveball/http-errors

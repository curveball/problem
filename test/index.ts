import { Application, Middleware } from '@curveball/core';
import problemMw from '../src/index';
import { expect } from 'chai';
import { stub } from 'sinon';
import { NotFound, ServiceUnavailable, MethodNotAllowed, Unauthorized } from '@curveball/http-errors';

class BlandError extends Error {
  httpStatus = 420;
}

const tester = (fun: Middleware, debug?: boolean, quiet?: boolean) => {

  const settings = {
    debug: debug !== undefined ? debug : undefined,
    quiet: quiet !== undefined ? quiet : undefined,
  };

  const app = new Application();
  app.use( problemMw(settings) );
  app.use( fun );

  return app.subRequest('GET', '/');

};

describe('Problem middleware', () => {

  it('should convert errors', async () => {

    const res = await tester( () => {
      throw new Error('Hello');
    });

    expect(res.status).to.equal(500);
    expect(res.body).to.eql({
      title: 'Internal Server Error',
      status: 500,
    });

  });

  it('should handle errors from the http-errors package', async () => {

    const res = await tester( () => {
      throw new NotFound('Hello');
    });

    expect(res.status).to.equal(404);
    expect(res.body).to.eql({
      title: 'Not Found',
      status: 404,
      detail: 'Hello',
    });

  });

  it('should generate a Retry-After header for exceptions that support it', async () => {

    const res = await tester( () => {
      throw new ServiceUnavailable('FooBar', 5);
    });

    expect(res.status).to.equal(503);
    expect(res.body).to.eql({
      title: 'Service Unavailable',
      status: 503,
      detail: 'FooBar',
    });
    expect(res.headers.get('Retry-After')).to.eql('5');

  });

  it('should generate an Allow header for 405 errors', async () => {

    const res = await tester( () => {
      throw new MethodNotAllowed('Zzz', ['PUT', 'PATCH']);
    });

    expect(res.status).to.equal(405);
    expect(res.body).to.eql({
      title: 'Method Not Allowed',
      status: 405,
      detail: 'Zzz',
    });
    expect(res.headers.get('Allow')).to.eql('PUT, PATCH');

  });

  it('should set a WWW-Authenticate header for 401 errors', async () => {

    const res = await tester( () => {
      throw new Unauthorized('Zzz', ['Bearer', 'Digest']);
    });

    expect(res.status).to.equal(401);
    expect(res.body).to.eql({
      title: 'Unauthorized',
      status: 401,
      detail: 'Zzz',
    });
    expect(res.headers.get('WWW-Authenticate')).to.eql('Bearer, Digest');

  });

  it('should send debug messages when debugMode is on via a flag', async () => {

    const res = await tester( () => {
      throw new Error('Hello');
    }, true);

    expect(res.status).to.equal(500);
    expect(res.body).to.eql({
      title: 'Hello',
      status: 500,
    });

  });

  it('should also turn on debug mode if an environment flag is set', async () => {

    process.env.NODE_ENV = 'development';

    const res = await tester( () => {
      throw new Error('Hello');
    });

    expect(res.status).to.equal(500);
    expect(res.body).to.eql({
      title: 'Hello',
      status: 500,
    });

    delete process.env.NODE_ENV;

  });

  it('should not log client warnings to the console if quiet mode is set', async() => {
    const consoleStub = stub(console, 'warn');

    await tester( () => {
      throw new Unauthorized('Zzz', ['Bearer', 'Digest']);
    }, false, true);

    expect(consoleStub.notCalled).to.be.true;

    await tester( () => {
      throw new Unauthorized('Zzz', ['Bearer', 'Digest']);
    }, false, false);

    expect(consoleStub.calledOnce).to.be.true;
  });

  it ('should log internal errors to the console if quiet mode is set', async() => {
    const consoleStub = stub(console, 'error');

    await tester( () => {
      throw new Error();
    }, false, true);

    expect(consoleStub.calledOnce).to.be.true;
  });

  it('should also correctly pick up "httpError" properties', async () => {

    const res = await tester( () => {
      throw new BlandError('Hello');
    });

    expect(res.status).to.equal(420);
    expect(res.body).to.eql({
      title: 'Hello',
      status: 420,
    });

  });

});

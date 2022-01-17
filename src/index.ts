import { Middleware } from '@curveball/core';
import { isClientError, isHttpError, isHttpProblem } from '@curveball/http-errors';

type ProblemMwSettings = {
  debug: boolean | undefined;
  quiet: boolean | undefined;
};

export default function(settings?: ProblemMwSettings): Middleware {

  let debugMode = false;
  if (settings?.debug !== undefined) {
    debugMode = settings.debug;
  } else if (process.env.NODE_ENV === 'development') {
    debugMode = true;
  }

  let quiet = false;
  if (settings?.quiet !== undefined) {
    quiet = settings.quiet;
  }

  return async (ctx, next) => {

    try {
      await next();
    } catch (e: any) {

      let status: number;
      let clientError = false;
      let title = e.message;
      let detail;

      if (isHttpError(e)) {
        status = e.httpStatus;
        clientError = isClientError(e);
        if (isHttpProblem(e) && e.title) {
          title = e.title;
        }
        if (isHttpProblem(e) && e.detail) {
          detail = e.detail;
        }

      } else {
        status = 500;
        if (!debugMode) {
          title = 'Internal Server Error';
        }
      }

      ctx.response.status = status;
      ctx.response.headers.set('Content-Type', 'application/problem+json');

      // 401 errors
      if (e.wwwAuthenticate) {
        ctx.response.headers.set('WWW-Authenticate', e.wwwAuthenticate);
      }

      // 405 errors
      if (e.allow) {
        ctx.response.headers.set('Allow', e.allow.join(', '));
      }

      // 413, 429 or 504 errors
      if (e.retryAfter) {
        ctx.response.headers.set('Retry-After', e.retryAfter);
      }

      ctx.response.body = {
        title,
        status
      };

      if (detail) {
        ctx.response.body.detail = detail;
      }

      if (clientError) {
        if (!quiet) {
          /* eslint-disable no-console */
          console.warn(e);
        }
      } else {
        console.error(e);
      }
    }

  };

}

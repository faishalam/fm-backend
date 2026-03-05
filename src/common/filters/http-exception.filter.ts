import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as { message?: string | string[] };
        message = Array.isArray(resp.message)
          ? resp.message[0]
          : (resp.message ?? message);
      }
    }

    response.status(status).json({
      status: 'error',
      code: status,
      message,
      data: null,
      error: exception instanceof Error ? exception.message : null,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

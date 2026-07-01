import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpAdapterHost } from '@nestjs/core';
import { Injectable } from '@nestjs/common';

@Injectable()
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let mapped: Error;
    switch (exception.code) {
      case 'P2002':
        mapped = new ConflictException(
          `A record with this ${(exception.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
        );
        break;
      case 'P2025':
        mapped = new NotFoundException('Record not found');
        break;
      case 'P2023':
        mapped = new BadRequestException('Invalid identifier supplied');
        break;
      default:
        mapped = exception;
    }

    const response = (mapped as any).getResponse?.() ?? { message: mapped.message };
    const status = (mapped as any).getStatus?.() ?? 500;

    httpAdapter.reply(ctx.getResponse(), response, status);
  }
}

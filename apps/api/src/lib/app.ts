import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes';

export async function buildServer() {

  const isDevelopment = process.env['NODE_ENV'] !== 'production';

  const server = Fastify({
  logger: isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : true,
   });

  await server.register(cors, { origin: '*' });

  registerRoutes(server);

  return server;
}
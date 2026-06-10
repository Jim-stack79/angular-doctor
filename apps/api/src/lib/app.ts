import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes';

const isDevelopment = process.env['NODE_ENV'] !== 'production';

export async function buildServer() {

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
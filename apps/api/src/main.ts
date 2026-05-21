import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './lib/routes';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3333;

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

async function bootstrap() {
  await server.register(cors, { origin: '*' });
  registerRoutes(server);

  try {
    await server.listen({ port, host });
    server.log.info({ host, port }, 'Server ready');
  } catch (err) {
    server.log.error(err, 'Server failed to start');
    process.exit(1);
  }
}

bootstrap();
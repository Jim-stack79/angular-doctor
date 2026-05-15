import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './lib/routes';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3333;

const server = Fastify({ logger: true });

async function bootstrap() {
  await server.register(cors, { origin: '*' });
  registerRoutes(server);

  try {
    await server.listen({ port, host });
    console.log(`[ ready ] http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap();
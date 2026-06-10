import { buildServer } from './lib/app';

const host = process.env['HOST'] ?? 'localhost';
const port = process.env['PORT'] ? Number(process.env['PORT']) : 3333;

async function bootstrap() {
  const server = await buildServer();

  try {
    await server.listen({
      port,
      host,
    });
    
    server.log.info({ host, port }, 'Server ready');

  } catch(err) {
    server.log.error(err, 'Server failed to start');
    process.exit(1);
  }

}

bootstrap();
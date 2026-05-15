import { FastifyInstance } from 'fastify';
import { AnalysisService } from './analysis.service';

const analysisService = new AnalysisService();

export function registerRoutes(server: FastifyInstance): void {
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  server.post<{ Body: { projectPath: string; withAI?: boolean } }>(
    '/analyze',
    {
      schema: {
        body: {
          type: 'object',
          required: ['projectPath'],
          properties: {
            projectPath: { type: 'string' },
            withAI: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectPath, withAI = false } = request.body;

      try {
        const result = await analysisService.analyze(projectPath, withAI);
        return reply.send(result);
      } catch (err) {
        return reply.status(400).send({
          error: (err as Error).message,
        });
      }
    }
  );

  server.get('/analyses', async () => {
    return analysisService.getAll();
  });

  server.get<{ Params: { id: string } }>('/analyses/:id', async (request, reply) => {
    const result = analysisService.getById(request.params.id);
    if (!result) {
      return reply.status(404).send({ error: 'Analysis not found' });
    }
    return result;
  });
}
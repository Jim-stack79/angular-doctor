import { FastifyInstance } from 'fastify';
import { AnalysisService } from './analysis.service';
import { explainIssue } from '@myorg/analyzer';
import type { Issue } from '@myorg/analyzer';

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


  server.post<{ Body: { issue: unknown } }>(
    '/explain',
    {
      schema: {
        body: {
          type: 'object',
          required: ['issue'],
          properties: {
            issue: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { issue } = request.body;
        const explanation = await explainIssue(issue as Issue);
        if (!explanation) {
          return reply.status(500).send({ error: 'AI explanation failed' });
        }
        return reply.send(explanation);
      } catch (err) {
        return reply.status(500).send({ error: (err as Error).message });
      }
    }
  );


}
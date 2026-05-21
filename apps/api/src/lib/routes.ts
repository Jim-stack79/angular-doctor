import { FastifyInstance } from 'fastify';
import { AnalysisService } from './analysis.service';
import { explainIssue } from '@myorg/analyzer';
import type { Issue } from '@myorg/analyzer';

const analysisService = new AnalysisService();

export function registerRoutes(server: FastifyInstance): void {
  server.get('/health', async (request, reply) => {
    request.log.debug('Health check requested');
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

      request.log.info({ projectPath, withAI }, 'Analysis requested');
      const start = Date.now();

      try {
        const result = await analysisService.analyze(projectPath, withAI);
        const duration = Date.now() - start;

        request.log.info(
          { projectPath, issuesFound: result.result.issues.length, duration },
          'Analysis complete'
        );

        return reply.send(result);
      } catch (err) {
        request.log.error({ projectPath, err }, 'Analysis failed');
        return reply.status(400).send({ error: (err as Error).message });
      }
    }
  );

  server.get('/analyses', async (request, reply) => {
    const analyses = analysisService.getAll();
    request.log.debug({ count: analyses.length }, 'Fetching all analyses');
    return analyses;
  });

  server.get<{ Params: { id: string } }>(
    '/analyses/:id',
    async (request, reply) => {
      const { id } = request.params;
      const result = analysisService.getById(id);

      if (!result) {
        request.log.warn({ id }, 'Analysis not found');
        return reply.status(404).send({ error: 'Analysis not found' });
      }

      request.log.debug({ id }, 'Analysis fetched');
      return result;
    }
  );

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
      const { issue } = request.body;

      request.log.info({ issue }, 'AI explanation requested');
      const start = Date.now();

      try {
        const explanation = await explainIssue(issue as Issue);
        const duration = Date.now() - start;

        if (!explanation) {
          request.log.warn({ issue, duration }, 'AI explanation returned empty');
          return reply.status(500).send({ error: 'AI explanation failed' });
        }

        request.log.info({ duration }, 'AI explanation complete');
        return reply.send(explanation);
      } catch (err) {
        request.log.error({ issue, err }, 'AI explanation failed');
        return reply.status(500).send({ error: (err as Error).message });
      }
    }
  );
}
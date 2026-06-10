import { describe, it, expect } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import request from 'supertest';
import path from 'path';

const provider = new PactV3({
  consumer: 'carbon-tracker-web',
  provider: 'carbon-tracker-api',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('API Contract Tests with Pact', () => {
  it('should verify contract for recording activities', async () => {
    provider
      .given('User is authenticated')
      .uponReceiving('a request to record a carbon activity')
      .withRequest({
        method: 'POST',
        path: '/api/v1/activities',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': MatchersV3.like('Bearer test-token'),
        },
        body: {
          category: 'TRANSPORT',
          amount: 15,
          unit: 'km',
          date: '2026-06-10T12:00:00.000Z',
          description: 'Commute to work',
        },
      })
      .willRespondWith({
        status: 201,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: {
          activityId: MatchersV3.uuid(),
          kgCO2e: MatchersV3.decimal(3.75),
          message: MatchersV3.like('Activity recorded successfully'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const res = await request(mockServer.url)
        .post('/api/v1/activities')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer test-token')
        .send({
          category: 'TRANSPORT',
          amount: 15,
          unit: 'km',
          date: '2026-06-10T12:00:00.000Z',
          description: 'Commute to work',
        });

      expect(res.status).toBe(201);
      const body = res.body as Record<string, unknown>;
      expect(body.activityId).toBeDefined();
      expect(body.kgCO2e).toBeDefined();
    });
  });
});

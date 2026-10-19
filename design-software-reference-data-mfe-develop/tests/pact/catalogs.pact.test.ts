import { MatchersV3, PactV3 } from '@pact-foundation/pact';
import { describe, expect, it } from 'vitest';

import { catalogsService } from '../../src/adapter/out/http/catalogsService.js';

const { eachLike, like } = MatchersV3;

const pact = new PactV3({
  consumer: 'ReferenceDataMfe',
  provider: 'ReferenceDataService',
  dir: `${process.cwd()}/pacts`,
  logLevel: 'warn',
});

describe('Reference Data catalog contract', () => {
  it('lists active catalogs through the real consumer adapter', async () => {
    pact
      .given('an active Reference Data catalog exists')
      .uponReceiving('a request for the first page of active catalogs')
      .withRequest({
        method: 'GET',
        path: '/api/v1/catalogs',
        query: { page: '1', page_size: '20', is_active: 'true' },
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: eachLike({
            id: like('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
            code: like('DOCUMENT_TYPE'),
            name: like('Document type'),
            description: like('Reference catalog for document types'),
            is_active: like(true),
            created_at: like('2026-01-01T00:00:00Z'),
          }),
          pagination: {
            page: 1,
            page_size: 20,
            total_items: like(1),
            total_pages: like(1),
          },
        },
      });

    await pact.executeTest(async (mockServer) => {
      const page = await catalogsService.list(`${mockServer.url}/api/v1`, {
        page: 1,
        pageSize: 20,
      });

      expect(page.pagination).toMatchObject({ page: 1, page_size: 20 });
      expect(page.data).toHaveLength(1);
      expect(page.data[0]).toMatchObject({ code: 'DOCUMENT_TYPE', is_active: true });
    });
  });
});

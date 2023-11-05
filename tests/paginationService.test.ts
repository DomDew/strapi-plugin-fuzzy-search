import { beforeAll, describe, expect, it } from 'vitest';
import {
  PaginatedModelResponse,
  PaginationArgs,
  RESTPaginationMeta,
} from '../server/interfaces/interfaces';
import {
  getTransformedUserPaginationInput,
  paginateGraphQlResults,
  paginateRestResults,
} from '../server/services/paginationService';
import { findManyResMock } from './utils/mocks';

const DEFAULT_LIMIT = 25;

describe('paginateRestResults', () => {
  it('paginates the results with count', async () => {
    const pagination = {
      tests: {
        page: undefined,
        pageSize: '2',
        withCount: 'true',
      },
    };

    const paginatedResults = (await paginateRestResults(pagination, ['tests'], {
      tests: findManyResMock,
    })) as unknown as Record<
      string,
      PaginatedModelResponse<RESTPaginationMeta>
    >;

    expect(paginatedResults.tests.data.length).toBe(2);
    expect((paginatedResults.tests.data[0] as any).id).toBe(1);
    expect((paginatedResults.tests.data[1] as any).id).toBe(2);
    expect(paginatedResults.tests.meta.pagination.page).toBe(1);
    expect(paginatedResults.tests.meta.pagination.pageCount).toBe(2);
    expect(paginatedResults.tests.meta.pagination.total).toBe(3);
    expect(paginatedResults.tests.meta.pagination.pageSize).toBe(2);
  });

  it("paginates the results without count if withCount isn't true", async () => {
    const pagination = {
      tests: {
        page: undefined,
        pageSize: '2',
        withCount: 'false',
      },
    };

    const paginatedResults = (await paginateRestResults(pagination, ['tests'], {
      tests: findManyResMock,
    })) as unknown as Record<
      string,
      PaginatedModelResponse<RESTPaginationMeta>
    >;

    expect(paginatedResults.tests.data.length).toBe(2);
    expect((paginatedResults.tests.data[0] as any).id).toBe(1);
    expect((paginatedResults.tests.data[1] as any).id).toBe(2);
    expect(paginatedResults.tests.meta.pagination.page).toBe(1);
    expect(paginatedResults.tests.meta.pagination.pageCount).toBe(undefined);
    expect(paginatedResults.tests.meta.pagination.total).toBe(undefined);
    expect(paginatedResults.tests.meta.pagination.pageSize).toBe(2);
  });

  it("changes the page if it's not the first one", async () => {
    const pagination = {
      tests: {
        page: '2',
        pageSize: '2',
        withCount: 'true',
      },
    };

    const paginatedResults = (await paginateRestResults(pagination, ['tests'], {
      tests: findManyResMock,
    })) as unknown as Record<
      string,
      PaginatedModelResponse<RESTPaginationMeta>
    >;

    expect(paginatedResults.tests.data.length).toBe(1);
    expect((paginatedResults.tests.data[0] as any).id).toBe(3);
    expect(paginatedResults.tests.meta.pagination.page).toBe(2);
    expect(paginatedResults.tests.meta.pagination.pageCount).toBe(2);
    expect(paginatedResults.tests.meta.pagination.total).toBe(3);
    expect(paginatedResults.tests.meta.pagination.pageSize).toBe(2);
  });

  it('uses default values if no params are passed', async () => {
    const pagination = {
      tests: {
        page: undefined,
        pageSize: undefined,
        withCount: undefined,
      },
    };

    const paginatedResults = (await paginateRestResults(pagination, ['tests'], {
      tests: findManyResMock,
    })) as unknown as Record<
      string,
      PaginatedModelResponse<RESTPaginationMeta>
    >;

    expect(paginatedResults.tests.data.length).toBe(3);
    expect((paginatedResults.tests.data[0] as any).id).toBe(1);
    expect((paginatedResults.tests.data[1] as any).id).toBe(2);
    expect((paginatedResults.tests.data[2] as any).id).toBe(3);
    expect(paginatedResults.tests.meta.pagination.page).toBe(1);
    expect(paginatedResults.tests.meta.pagination.pageCount).toBe(1);
    expect(paginatedResults.tests.meta.pagination.total).toBe(3);
    expect(paginatedResults.tests.meta.pagination.pageSize).toBe(DEFAULT_LIMIT);
  });
});

describe('getTransformedPagination', () => {
  beforeAll(() => {
    global.strapi = {
      plugin: (name: string) =>
        ({
          graphql: {
            config: (key: string) =>
              ({
                defaultLimit: DEFAULT_LIMIT,
              })[key],
          },
        })[name],
    } as any;
  });

  it('returns the default pagination if no args are passed', () => {
    const paginationArgs: PaginationArgs = {};
    const transformedPagination =
      getTransformedUserPaginationInput(paginationArgs);
    expect(transformedPagination).toEqual({
      limit: DEFAULT_LIMIT,
      start: 0,
    });
  });

  it('transforms the page and pageSize params to limit and start values', () => {
    const paginationArgs: PaginationArgs = {
      page: 2,
      pageSize: 10,
    };
    const transformedPagination =
      getTransformedUserPaginationInput(paginationArgs);
    expect(transformedPagination).toEqual({
      limit: 10,
      start: 10,
    });
  });

  it("returns start and limit if they're passed", () => {
    const paginationArgs: PaginationArgs = {
      limit: 10,
      start: 20,
    };
    const transformedPagination =
      getTransformedUserPaginationInput(paginationArgs);
    expect(transformedPagination).toEqual({
      limit: 10,
      start: 20,
    });
  });
});

describe('paginateGraphQlResults', () => {
  it('paginates the results', () => {
    const paginationArgs = {
      limit: 3,
      start: 2,
    };

    const paginatedGraphQlResults = paginateGraphQlResults(
      findManyResMock,
      paginationArgs,
    );
    expect(paginatedGraphQlResults.data.length).toBe(1);
    expect((paginatedGraphQlResults.data[0] as any).id).toBe(3);
    expect(paginatedGraphQlResults.meta.start).toBe(2);
    expect(paginatedGraphQlResults.meta.limit).toBe(3);
  });
});

import { Cache, Data, QueryInput } from '@urql/exchange-graphcache';

const updateQueryHelper = <Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) =>
  cache.updateQuery(qi, (data: Data | null) => fn(result, data as any) as any);

export default updateQueryHelper;

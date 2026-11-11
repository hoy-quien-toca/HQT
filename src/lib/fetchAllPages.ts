/** PostgREST returns at most 1000 rows per request unless the query is paged. */
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function fetchAllPages<T>(
  queryPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<PageResult<T>> {
  const data: T[] = [];
  let from = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const { data: rows, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) return { data, error };
    const batch = rows ?? [];
    data.push(...batch);
    if (batch.length < PAGE_SIZE) return { data, error: null };
    from += PAGE_SIZE;
  }

  return { data, error: null };
}

export function paginate(
  query,
  page = 1,
  limit = 20
) {

  const start =
    (page - 1) * limit;

  const end =
    start + limit - 1;

  return query.range(
    start,
    end
  );
}

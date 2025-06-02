export async function chunk<I, R>(
  items: I[],
  size: number,
  fn: (chunk: I) => Promise<R>,
): Promise<R[]> {
  let result: R[] = [];

  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);

    result = result.concat(await Promise.all(chunk.map(fn)));
  }

  return result;
}

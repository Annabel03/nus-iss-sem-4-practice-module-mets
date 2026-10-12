/** Trim a fixed set of characters without rescanning suffixes with a regex. */
export function trimEndCharacters(value: string, characters: string) {
  let end = value.length;
  while (end > 0 && characters.includes(value[end - 1])) end--;
  return value.slice(0, end);
}

export function asciiSlug(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const start = slug.startsWith("-") ? 1 : 0;
  return trimEndCharacters(slug.slice(start), "-");
}

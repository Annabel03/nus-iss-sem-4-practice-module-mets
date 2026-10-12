function trimHorizontalEnd(text: string) {
  let end = text.length;
  while (end > 0 && (text[end - 1] === " " || text[end - 1] === "\t")) end--;
  return text.slice(0, end);
}

/** Remove spaces and tabs before newlines without retrying a regex at each space. */
export function stripLineEndWhitespace(text: string) {
  const lines = text.split("\n");
  return lines.map((line, index) =>
    index < lines.length - 1 ? trimHorizontalEnd(line) : line,
  ).join("\n");
}

/** Scan image delimiters once, including malformed repeated opening markers. */
export function stripModelImageMarkup(
  text: string,
  options: { truncated?: boolean; graphs?: boolean; leadingSpaces?: boolean } = {},
) {
  const markers = /!\[|<img\b|<svg\b|<jsxgraph\b|data:image\//gi;
  const dataUri = /[\w.+-]+;base64,[A-Za-z0-9+/=]*/iy;
  const delimiters = new Map<string, number>();
  const output: string[] = [];
  let cursor = 0;

  // Cache the next closing delimiter, so failed opening markers cannot rescan it.
  const closing = (delimiter: string, from: number) => {
    let next = delimiters.get(delimiter) ?? -1;
    if (next < from) {
      next = text.indexOf(delimiter, from);
      if (next === -1) next = text.length;
      delimiters.set(delimiter, next);
    }
    return next;
  };

  for (let marker = markers.exec(text); marker; marker = markers.exec(text)) {
    const token = marker[0].toLowerCase();
    let end: number;
    if (token === "![") {
      const bracket = closing("]", markers.lastIndex);
      if (text[bracket + 1] !== "(") continue;
      const parenthesis = closing(")", bracket + 2);
      if (parenthesis === text.length && !options.truncated) continue;
      end = Math.min(parenthesis + 1, text.length);
    } else if (token === "<img") {
      const angle = closing(">", markers.lastIndex);
      if (angle === text.length && !options.truncated) continue;
      end = Math.min(angle + 1, text.length);
    } else if (token === "<svg" || token === "<jsxgraph") {
      if (!options.graphs) continue;
      const closeTag = token === "<svg" ? /<\/svg>/gi : /<\/jsxgraph>/gi;
      closeTag.lastIndex = markers.lastIndex;
      const closed = closeTag.exec(text);
      end = closed ? closed.index + closed[0].length : text.length;
      if (token === "<jsxgraph") {
        const selfClosing = text.indexOf("/>", markers.lastIndex);
        if (selfClosing !== -1) end = Math.min(end, selfClosing + 2);
      }
    } else {
      if (!options.graphs) continue;
      dataUri.lastIndex = markers.lastIndex;
      if (!dataUri.exec(text)) continue;
      end = dataUri.lastIndex;
    }

    const before = text.slice(cursor, marker.index);
    output.push(options.leadingSpaces ? trimHorizontalEnd(before) : before);
    cursor = end;
    markers.lastIndex = end;
  }
  output.push(text.slice(cursor));
  return output.join("");
}

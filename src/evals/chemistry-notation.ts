function normaliseChemistryNotation(text: string) {
  return text
    .replace(/\\(?:text|mathrm|ce)\s*\{([^{}]*)\}/gi, "$1")
    .replace(/_\s*\{([^{}]*)\}/g, "$1")
    .replace(/_\s*(\d+)/g, "$1")
    .replace(/\\(?:longrightarrow|rightarrow|to)\b|(?:->|=>|⟶|⟹)/g, "→")
    .replace(/\\(?:longleftarrow|leftarrow)\b|(?:<-|<=|⟵|⟸)/g, "←")
    .replace(/\${1,2}|\\(?:\[|\]|\(|\))/g, "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function chemistryPhraseIncludes(text: string, phrase: string) {
  return normaliseChemistryNotation(text).includes(normaliseChemistryNotation(phrase));
}

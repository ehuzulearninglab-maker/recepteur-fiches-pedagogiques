import type { FicheContenu, JsonValue } from "@/lib/types";

const RAW_TEXT_KEYS = [
  "texte_integral",
  "texte_original",
  "texte_de_la_fiche",
  "fiche_texte",
  "fiche_complete",
  "contenu_texte"
];

const SECTION_STARTS = [
  "competences",
  "connaissances",
  "strategies",
  "strategie",
  "materiel",
  "b -",
  "b-",
  "c -",
  "c-",
  "ii -",
  "ii-",
  "deroulement",
  "je retiens",
  "variante",
  "notes personnelles",
  "pre requis",
  "prerequis",
  "realisation",
  "retour",
  "projection",
  "objectivation",
  "evaluation"
];

const DEROULEMENT_STOP_STARTS = ["je retiens", "variante", "notes personnelles", "notes", "annexe"];

function canonical(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0153/g, "oe")
    .replace(/\u0152/g, "oe")
    .replace(/\u00b0/g, "o")
    .replace(/[\u2019']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9:./ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasText(value: JsonValue | undefined): boolean {
  return textValue(value).length > 0;
}

function rawTextFrom(content: FicheContenu): string {
  for (const key of RAW_TEXT_KEYS) {
    const value = textValue(content[key]);
    if (value) {
      return value;
    }
  }
  return "";
}

function linesOf(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function setIfMissing(target: FicheContenu, key: string, value: string) {
  const cleaned = value.trim();
  if (cleaned && !hasText(target[key])) {
    target[key] = cleaned;
  }
}

function valueAfterColon(line: string): string {
  const match = line.match(/^[^:\uFF1A]+[:\uFF1A]\s*(.+)$/);
  return match?.[1]?.trim() ?? "";
}

function findLineValue(lines: string[], pattern: RegExp, useWholeLine = false): string {
  for (const line of lines) {
    const match = canonical(line).match(pattern);
    if (!match) {
      continue;
    }

    if (useWholeLine) {
      return line;
    }

    return valueAfterColon(line) || match[1]?.trim() || "";
  }
  return "";
}

function firstLine(lines: string[]): string {
  return lines.find((line) => !/^(cours|duree|seance|date|sa\s*no?)/i.test(canonical(line))) ?? "";
}

function startsNewSection(line: string): boolean {
  const value = canonical(line);
  return SECTION_STARTS.some((start) => value.startsWith(start)) || /^[a-z]\s*-/.test(value);
}

function extractBlock(lines: string[], label: string): string {
  const start = lines.findIndex((line) => canonical(line).startsWith(label));
  if (start === -1) {
    return "";
  }

  const first = valueAfterColon(lines[start]);
  const values: string[] = first ? [first] : [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (startsNewSection(line)) {
      break;
    }
    values.push(line);
  }

  return values.join("\n").trim();
}

function extractBetween(lines: string[], startLabel: string, endLabels: string[] = []): string {
  const start = lines.findIndex((line) => canonical(line).startsWith(startLabel));
  if (start === -1) {
    return "";
  }

  const values: string[] = [];
  const first = valueAfterColon(lines[start]);
  if (first) {
    values.push(first);
  }

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const clean = canonical(line);
    if (endLabels.some((label) => clean.startsWith(label))) {
      break;
    }
    values.push(line);
  }

  return values.join("\n").trim();
}

function isDeroulementStart(line: string): boolean {
  const value = canonical(line).replace(/[:.]+$/g, "");
  return value === "deroulement" || /^ii\s*-?\s*deroulement/.test(value);
}

function isDeroulementStop(line: string): boolean {
  const value = canonical(line);
  return DEROULEMENT_STOP_STARTS.some((label) => value.startsWith(label));
}

function isDeroulementHeader(line: string): boolean {
  const value = canonical(line);
  return /^consignes?\s+resultats?/.test(value) || /^-+\s*-+$/.test(value);
}

function splitMarkdownRow(line: string): { consignes: string; resultats_attendus: string } | undefined {
  if (!line.includes("|")) {
    return undefined;
  }

  const cells = line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (cells.length < 2 || cells.every((cell) => /^-+$/.test(cell))) {
    return undefined;
  }

  const header = cells.map(canonical).join(" ");
  if (/consignes?\s+resultats?/.test(header)) {
    return undefined;
  }

  return {
    consignes: cells[0],
    resultats_attendus: cells.slice(1).join("\n")
  };
}

function splitDelimitedRow(line: string): { consignes: string; resultats_attendus: string } | undefined {
  const tabParts = line.split(/\t+/).map((part) => part.trim()).filter(Boolean);
  const spacedParts = tabParts.length > 1 ? tabParts : line.split(/\s{3,}/).map((part) => part.trim()).filter(Boolean);

  if (spacedParts.length < 2) {
    return undefined;
  }

  return {
    consignes: spacedParts[0],
    resultats_attendus: spacedParts.slice(1).join("\n")
  };
}

function splitCompactExpectedResult(line: string): { consignes: string; resultats_attendus: string } | undefined {
  const normalized = canonical(line);
  const markers = [
    " a ",
    " ont ",
    " les apprenants ",
    " les eleves ",
    " lapprenant ",
    " propose ",
    " proposent ",
    " identifie ",
    " identifient ",
    " cite ",
    " citent ",
    " donne ",
    " donnent ",
    " repond ",
    " repondent ",
    " explique ",
    " expliquent ",
    " realise ",
    " realisent "
  ];
  const marker = markers
    .map((item) => ({ item, index: ` ${normalized} `.indexOf(item) }))
    .filter((item) => item.index > 0)
    .sort((a, b) => a.index - b.index)[0];

  if (!marker) {
    return undefined;
  }

  const rawIndex = Math.max(1, marker.index - 1);
  return {
    consignes: line.slice(0, rawIndex).trim(),
    resultats_attendus: line.slice(rawIndex).trim()
  };
}

function splitDeroulementRow(line: string): { consignes: string; resultats_attendus: string } {
  return (
    splitMarkdownRow(line) ||
    splitDelimitedRow(line) ||
    splitCompactExpectedResult(line) || {
      consignes: line,
      resultats_attendus: ""
    }
  );
}

function parseDeroulement(lines: string[]): Array<{ consignes: string; resultats_attendus: string }> {
  const start = lines.findIndex(isDeroulementStart);
  if (start === -1) {
    return [];
  }

  const rows: Array<{ consignes: string; resultats_attendus: string }> = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (isDeroulementStop(line)) {
      break;
    }
    if (isDeroulementHeader(line)) {
      continue;
    }

    const row = splitDeroulementRow(line);
    if (row.consignes || row.resultats_attendus) {
      rows.push(row);
    }
  }

  return rows;
}

function joinRows(rows: Array<{ consignes: string; resultats_attendus: string }>, key: "consignes" | "resultats_attendus"): string {
  return rows.map((row) => row[key]).filter(Boolean).join("\n");
}

export function normalizeImportedFiche(content: FicheContenu): FicheContenu {
  const rawText = rawTextFrom(content);
  if (!rawText) {
    return content;
  }

  const lines = linesOf(rawText);
  const next: FicheContenu = { ...content, texte_integral: textValue(content.texte_integral) || rawText };

  setIfMissing(next, "fiche_de", firstLine(lines));
  setIfMissing(next, "cours", findLineValue(lines, /^cours\s*:\s*(.+)$/));
  setIfMissing(next, "duree", findLineValue(lines, /^duree\s*:\s*(.+)$/));
  setIfMissing(next, "fiche_no", findLineValue(lines, /^seance\s*no?\s*(.+)$/));
  setIfMissing(next, "date", findLineValue(lines, /^date\s*:\s*(.+)$/));
  setIfMissing(next, "san", findLineValue(lines, /^sa\s*no?\s*.+$/, true));
  setIfMissing(next, "sequence", findLineValue(lines, /^titre\s*:\s*(.+)$/));

  setIfMissing(next, "competences_disciplinaires", extractBlock(lines, "competences disciplinaires"));
  setIfMissing(next, "competences_transversales", extractBlock(lines, "competences transversales"));
  setIfMissing(next, "competences_transdisciplinaires", extractBlock(lines, "competences transdisciplinaires"));
  setIfMissing(next, "connaissances_et_techniques", extractBlock(lines, "connaissances et techniques"));
  setIfMissing(next, "contenu_de_formation", textValue(next.connaissances_et_techniques));

  const strategies = extractBlock(lines, "b- strategies") || extractBlock(lines, "b - strategies");
  setIfMissing(next, "strategie_objet_apprentissage", strategies);
  setIfMissing(next, "strategies_enseignement_apprentissage_evaluation", strategies);
  setIfMissing(next, "materiel", extractBlock(lines, "c- materiel") || extractBlock(lines, "c - materiel"));

  const deroulement = parseDeroulement(lines);
  const existingRows = Array.isArray(next.deroulement) ? next.deroulement.length : 0;
  if (deroulement.length > existingRows) {
    next.deroulement = deroulement as unknown as JsonValue;
  }

  setIfMissing(next, "consignes", joinRows(deroulement, "consignes"));
  setIfMissing(next, "resultats_attendus", joinRows(deroulement, "resultats_attendus"));
  setIfMissing(next, "je_retiens", extractBetween(lines, "je retiens", ["variante", "notes personnelles", "notes"]));
  setIfMissing(next, "variante_pedagogique_possible", extractBetween(lines, "variante pedagogique possible", ["notes personnelles", "notes"]));
  setIfMissing(next, "notes_personnelles", extractBetween(lines, "notes personnelles"));

  return next;
}

export const RAW_TEXT_FIELD_KEYS = RAW_TEXT_KEYS;

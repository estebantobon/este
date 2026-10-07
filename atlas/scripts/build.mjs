// Collects atlas/entries/*/entry.json into atlas/dist/atlas.json for play.html.
// Zero dependencies: run with `node atlas/scripts/build.mjs`.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const schema = JSON.parse(readFileSync(join(root, 'schema/entry.schema.json'), 'utf8'));
const TOPICS = schema.properties.topic.enum;
const GRADES = ['A', 'B', 'C', 'D'];
const VERDICTS = ['holds', 'overstated', 'unsupported'];

const errors = [];
const entries = readdirSync(join(root, 'entries'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => {
    const dir = join(root, 'entries', d.name);
    const entry = JSON.parse(readFileSync(join(dir, 'entry.json'), 'utf8'));
    const where = `entries/${d.name}`;
    for (const key of schema.required) if (entry[key] === undefined) errors.push(`${where}: missing ${key}`);
    if (entry.slug !== d.name) errors.push(`${where}: slug "${entry.slug}" must match folder name`);
    if (!TOPICS.includes(entry.topic)) errors.push(`${where}: unknown topic "${entry.topic}"`);
    (entry.claims || []).forEach((c, i) => {
      if (!GRADES.includes(c.grade)) errors.push(`${where}: claim ${i} has bad grade "${c.grade}"`);
      if (!VERDICTS.includes(c.verdict)) errors.push(`${where}: claim ${i} has bad verdict "${c.verdict}"`);
      if (!c.note) errors.push(`${where}: claim ${i} has no note`);
    });
    const notes = join(dir, 'notes.md');
    return { ...entry, has_notes: existsSync(notes) };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const count = (v) => entries.flatMap(e => e.claims).filter(c => c.verdict === v).length;
const out = {
  generated: new Date().toISOString().slice(0, 10),
  totals: { entries: entries.length, claims: entries.reduce((n, e) => n + e.claims.length, 0), holds: count('holds'), overstated: count('overstated'), unsupported: count('unsupported') },
  entries,
};
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/atlas.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`atlas.json: ${out.totals.entries} entries, ${out.totals.claims} claims`);

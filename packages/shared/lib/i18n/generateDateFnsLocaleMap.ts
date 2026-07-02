import { readdirSync, writeFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const localeDir = require.resolve('date-fns/locale/en-US').replace(/en-US.*$/, '');

const locales = readdirSync(localeDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name);

const entries = locales
    .map(
        (l) =>
            `  '${l.replace('-', '_')}': () => import(/* webpackChunkName: "date-fns/${l}" */ 'date-fns/locale/${l}').then((m) => m.default),`
    )
    .join('\n');

const output = process.argv[2];

if (!output) {
    throw new Error('Missing output filename');
}

writeFileSync(
    output,
    `
// Generated file — do not edit
import type { DateFnsLocaleMap } from '../interfaces/Locale';

export const dateFnsLocaleMap: DateFnsLocaleMap = {
   ${entries}\n};
`
);

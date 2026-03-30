import fs from 'fs';
import path from 'path';

const dateFnsLocaleRegex = /^[a-z]{2}(-[A-Z]{2})?$/;

export const getDateFnsLocales = (): string[] => {
    const dateFnsLocaleDir = path.join(path.dirname(require.resolve('date-fns/package.json')), 'locale');
    if (!fs.existsSync(dateFnsLocaleDir)) {
        return [];
    }
    return fs
        .readdirSync(dateFnsLocaleDir, { withFileTypes: true })
        .filter(
            (d) =>
                d.isDirectory() &&
                dateFnsLocaleRegex.test(d.name) &&
                fs.existsSync(path.join(dateFnsLocaleDir, d.name, 'index.js'))
        )
        .map((d) => d.name);
};

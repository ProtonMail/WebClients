import path from 'node:path';

import { usesOxlint } from './utilities/repo-rules/src/shared/oxlint.ts';

// Folders formatted with oxfmt. Everything else is still formatted with prettier.
const OXFMT_FOLDERS = ['applications/mail/', 'applications/calendar/', 'packages/mail/', 'packages/calendar/'];

const usesOxfmt = (file) => {
    const relative = path.relative(process.cwd(), path.resolve(file));
    return OXFMT_FOLDERS.some((folder) => relative.split(path.sep).join('/').startsWith(folder));
};

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': (files) => {
        const oxlintFiles = files.filter((file) => usesOxlint(path.dirname(file)));
        const oxfmtFiles = files.filter(usesOxfmt);
        const prettierFiles = files.filter((file) => !usesOxfmt(file));
        return [
            ...(oxlintFiles.length ? [`oxlint --fix --max-warnings=0 ${quote(oxlintFiles)}`] : []),
            ...(oxfmtFiles.length ? [`oxfmt --write ${quote(oxfmtFiles)}`] : []),
            ...(prettierFiles.length ? [`prettier --write ${quote(prettierFiles)}`] : []),
        ];
    },
    '(*.scss|.css)': ['prettier --write', 'stylelint --fix'],
    '(!(package).json|*.md|*.mdx|*.html|*.mjs|*.yml|*.svg)': 'prettier --write',
    'package.json': [() => 'pnpm run check:constraints', 'sort-package-json', 'prettier --write'],
    'ci/bin/drive-release/drive-release': 'ci/bin/drive-release/check-binary-platform.sh',
};

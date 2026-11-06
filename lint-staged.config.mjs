import path from 'node:path';

import { usesOxfmt } from './utilities/repo-rules/src/shared/oxfmt.ts';
import { usesOxlint } from './utilities/repo-rules/src/shared/oxlint.ts';

// Workspaces with an oxfmt.config.ts are formatted with oxfmt. Everything else is still formatted with prettier.
const usesOxfmtFile = (file) => usesOxfmt(path.dirname(path.resolve(file)));

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': (files) => {
        const oxlintFiles = files.filter((file) => usesOxlint(path.dirname(file)));
        const oxfmtFiles = files.filter(usesOxfmtFile);
        const prettierFiles = files.filter((file) => !usesOxfmtFile(file));
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

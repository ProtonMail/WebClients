import path from 'node:path';

import { usesOxlint } from './utilities/repo-rules/src/shared/oxlint.ts';

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': (files) => {
        const oxlintFiles = files.filter((file) => usesOxlint(path.dirname(file)));
        return [
            ...(oxlintFiles.length ? [`oxlint --fix --max-warnings=0 ${quote(oxlintFiles)}`] : []),
            `prettier --write ${quote(files)}`,
        ];
    },
    '(*.scss|.css)': ['prettier --write', 'stylelint --fix'],
    '(!(package).json|*.md|*.mdx|*.html|*.mjs|*.yml|*.svg)': 'prettier --write',
    'package.json': [() => 'pnpm run check:constraints', 'sort-package-json', 'prettier --write'],
    'ci/bin/drive-release/drive-release': 'ci/bin/drive-release/check-binary-platform.sh',
};

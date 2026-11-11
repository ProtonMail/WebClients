import path from 'node:path';

import { usesOxlint } from './utilities/repo-rules/src/shared/oxlint.ts';

// Personal opt-in rules (oxlint.local.mts) must never block or autofix a commit
process.env.PROTON_OXLINT_NO_LOCAL = '1';

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': (files) => {
        const oxlintFiles = files.filter((file) => usesOxlint(path.dirname(file)));
        return [
            ...(oxlintFiles.length ? [`oxlint --fix --max-warnings=0 ${quote(oxlintFiles)}`] : []),
            `oxfmt --write --no-error-on-unmatched-pattern ${quote(files)}`,
        ];
    },
    '(*.scss|.css)': ['oxfmt --write --no-error-on-unmatched-pattern', 'stylelint --fix'],
    '(!(package).json|*.md|*.mdx|*.html|*.mjs|*.yml)': 'oxfmt --write --no-error-on-unmatched-pattern',
    'package.json': [() => 'pnpm run check:constraints', 'sort-package-json'],
    'ci/bin/drive-release/drive-release': 'ci/bin/drive-release/check-binary-platform.sh',
};

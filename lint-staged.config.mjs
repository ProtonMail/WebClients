import fs from 'node:fs';
import path from 'node:path';

const usesOxlintByDirectory = new Map();

/**
 * Code moves from ESLint to oxlint one folder at a time: a migrated folder has an oxlint.config.mts, which can also
 * sit outside a workspace (e.g. ci/bin/update-chargebee-iframe). The nearest oxlint.config.mts or package.json decides.
 */
function usesOxlint(directory) {
    if (!usesOxlintByDirectory.has(directory)) {
        let result = false;
        if (fs.existsSync(path.join(directory, 'oxlint.config.mts'))) {
            result = true;
        } else if (!fs.existsSync(path.join(directory, 'package.json')) && path.dirname(directory) !== directory) {
            result = usesOxlint(path.dirname(directory));
        }
        usesOxlintByDirectory.set(directory, result);
    }
    return usesOxlintByDirectory.get(directory);
}

const quote = (files) => files.map((file) => JSON.stringify(file)).join(' ');

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': (files) => {
        const oxlintFiles = files.filter((file) => usesOxlint(path.dirname(file)));
        const eslintFiles = files.filter((file) => !usesOxlint(path.dirname(file)));
        return [
            ...(oxlintFiles.length ? [`oxlint --fix --max-warnings=0 ${quote(oxlintFiles)}`] : []),
            ...(eslintFiles.length ? [`eslint --fix --max-warnings=0 --no-warn-ignored ${quote(eslintFiles)}`] : []),
            `prettier --write ${quote(files)}`,
        ];
    },
    '(*.scss|.css)': ['prettier --write', 'stylelint --fix'],
    '(!(package).json|*.md|*.mdx|*.html|*.mjs|*.yml|*.svg)': 'prettier --write',
    'package.json': [
        'eslint --config packages/eslint-config-proton/package-json.js --max-warnings=0 --no-warn-ignored',
        'sort-package-json',
        'prettier --write',
    ],
    'ci/bin/drive-release/drive-release': 'ci/bin/drive-release/check-binary-platform.sh',
};

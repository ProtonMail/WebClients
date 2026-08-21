/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
    '(*.scss|.css)': ['prettier --write', 'stylelint --fix'],
    '(*.json|*.md|*.mdx|*.html|*.mjs|*.yml|*.svg)': 'prettier --write',
    'package.json': [
        'eslint --config packages/eslint-config-proton/package-json.js --max-warnings=0 --no-warn-ignored',
        'sort-package-json',
    ],
    'yarn.lock': 'yarn dedupe --strategy=highest',
};

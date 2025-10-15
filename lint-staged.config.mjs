/**
 * @type {import('lint-staged').Configuration}
 */
export default {
    '(*.ts|*.tsx|*.js)': ['eslint --fix --max-warnings=0 --flag v10_config_lookup_from_file', 'prettier --write'],
    '(*.scss|.css)': ['prettier --write', 'stylelint --fix'],
    '(*.json|*.md|*.mdx|*.html|*.mjs|*.yml|*.svg)': 'prettier --write',
    'package.json': 'sort-package-json',
};

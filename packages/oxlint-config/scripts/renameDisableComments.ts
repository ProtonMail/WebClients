/**
 * Rewrites ESLint rule names in disable comments to the oxlint rules that replace them, so the
 * comments keep silencing the same findings after a workspace moves to oxlint.
 *
 * Usage: pnpm --filter @proton/oxlint-config run rename-disable-comments <workspace-directory>
 */
/* eslint-disable no-console -- command line output */
import fs from 'node:fs';
import path from 'node:path';

const RENAMED_RULES: Record<string, string> = {
    'no-restricted-imports': 'proton/restricted-imports',
    '@typescript-eslint/no-restricted-imports': 'proton/restricted-imports',
    'import/no-internal-modules': 'proton/restricted-imports',
    'lodash/import-scope': 'proton/restricted-imports',
    'no-restricted-syntax': 'proton/restricted-syntax',
    '@typescript-eslint/naming-convention': 'proton/naming-convention',
    'import/no-extraneous-dependencies': 'proton/no-extraneous-dependencies',
    '@protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer':
        'proton/enforce-uint8array-arraybuffer',
};

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.turbo']);

// `eslint-disable-next-line a, b -- reason`, in line or block comments.
const DIRECTIVE = /((?:eslint|oxlint)-disable(?:-next-line|-line)?)([ \t]+)([^\n*]*?)(?=[ \t]*(?:--|\*\/|$))/gm;

function renameRules(ruleList: string) {
    const rules = ruleList
        .split(',')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) => RENAMED_RULES[rule] ?? rule);
    return [...new Set(rules)].join(', ');
}

function rewrite(source: string) {
    return source.replace(DIRECTIVE, (match, directive: string, space: string, ruleList: string) => {
        if (!ruleList.trim()) {
            return match;
        }
        return `${directive}${space}${renameRules(ruleList)}`;
    });
}

function* sourceFiles(directory: string): Generator<string> {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)) {
            yield* sourceFiles(entryPath);
        } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            yield entryPath;
        }
    }
}

const [workspace] = process.argv.slice(2);
if (!workspace) {
    console.error('Usage: renameDisableComments.ts <workspace-directory>');
    process.exit(1);
}

let changedFiles = 0;
// `pnpm run` executes in this package, so resolve the argument against where the command was typed.
const invocationDirectory = process.env.INIT_CWD ?? process.cwd();
for (const file of sourceFiles(path.resolve(invocationDirectory, workspace))) {
    const source = fs.readFileSync(file, 'utf8');
    const rewritten = rewrite(source);
    if (rewritten !== source) {
        fs.writeFileSync(file, rewritten);
        changedFiles += 1;
        console.log(path.relative(invocationDirectory, file));
    }
}
console.log(`${changedFiles} file(s) updated`);

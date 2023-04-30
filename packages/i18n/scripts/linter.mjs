/*
 * Usage node linter.mjs [arg]
 *  - arg can be a directory or a single file (default src)
 */
import { readFile } from 'fs/promises';
import { sync } from 'glob';
import path from 'path';

/**
 * Test a rule inside the code and see if we find lines matching it
 * @param RegExp rule rule to test inside the whole content
 * @param String content text file content
 * @param String type type of rule you filter
 * @return Object { errors: <Iterator { file:String, line:String, match:String, index:Number, type:String}>, match: Boolean }
 */
function testRule(rule, content, type) {
    const matches = content.match(rule);

    function* errors(file) {
        if (!matches?.length) {
            return;
        }

        for (const [index, line] of content.split('\n').entries()) {
            const done = new Set();
            for (const match of matches) {
                const hasNewLine = match.includes('\n');
                // If multiline matches
                const [, string] = match.split('\n');
                const toMatch = hasNewLine ? string : match;
                const id = `${line}:${index}${match}`;
                if (!line.includes(toMatch) || done.has(id)) {
                    continue;
                }
                done.add(id);
                yield {
                    file,
                    line,
                    match,
                    string,
                    index,
                    type,
                };
            }
        }
    }

    return { match: matches?.length > 0, errors };
}

/**
 * Iterate over all your source files and see if we can find broken translations
 * @param String source source to iterate over (directory or a single file)
 * @Return Iterator from @testRule.errors
 */
async function* errorIterator(source = 'src', options = {}) {
    const { ext } = path.parse(source);
    const files = ext
        ? [source]
        : sync(path.join(source, '**', '*.{js,jsx,ts,tsx}'), {
              ignore: [path.join(source, 'node_modules', '**')],
          });

    for (const file of files) {
        if (file.endsWith('.d.ts') || file.includes('tests')) {
            continue;
        }
        if (file.includes('stories')) {
            continue;
        }

        if (options.isVerbose) {
            console.log('[lint]', file);
        }
        const content = await readFile(file, 'utf-8');

        const errorsFormat = testRule(/c\(\x27.+\x27\)\.(t|c)\(/g, content, 'format');
        if (errorsFormat.match) {
            yield* errorsFormat.errors(file);
        }

        const errorsUsage = testRule(/c\(\x27.+\x27\)\.(c\x60|\x60)/g, content, 'usage');
        if (errorsUsage.match) {
            yield* errorsUsage.errors(file);
        }

        const errorsPlurals = testRule(
            /c\(\x27.+\x27\)\.ngettext\(msgid(\x60|\().+(\x60|\)),\s(\x27|\x22)/g,
            content,
            'plurals'
        );
        if (errorsPlurals.match) {
            yield* errorsPlurals.errors(file);
        }

        const errorsBackticks = testRule(/c\((\s+\x60|\x60).+(\x60|\x60\s+)\)/g, content, 'backticks');
        if (errorsBackticks.match) {
            yield* errorsBackticks.errors(file);
        }
    }
}

function formatErrors({ type, ...error }) {
    if (type === 'format') {
        return `🚨 [Error] ${error.file}:${error.index}
    match: ${error.match}
     line: ${error.line}
      fix: You should not use - c(<context>).t(<string>) or c(<context>).c(<string>)
           but c(<context>).t\`<string>\`
`;
    }
    if (type === 'usage') {
        return `🚨 [Error] ${error.file}:${error.index}
    match: ${error.match}
     line: ${error.line}
      fix: You should not use - c(<context>).c\`<string>\` or c(<context>).\`<string>\`
           but c(<context>).t\`<string>\`
`;
    }
    if (type === 'backticks') {
        return `🚨 [Error] ${error.file}:${error.index}
    match: ${error.match}
     line: ${error.line}
      fix: You should not use backticks for the context definition. It is a static string
           best to use c(\x27<context>\x27).t\`<string>\`
`;
    }

    if (type === 'plurals') {
        return `🚨 [Error] ${error.file}:${error.index}
    match: ${error.match}
     line: ${error.line}
      fix: Plural form is  - ngettext(msgid\`<string single>\`, \`<string plural>\`, value)
`;
    }
}

async function main() {
    const [, , source] = process.argv;
    const isVerbose = process.argv.includes('--verbose');
    let total = 0;
    for await (const error of errorIterator(source, { isVerbose })) {
        total++;
        console.log(formatErrors(error));
    }

    total && console.log(`Found ${total} error(s)`);

    // If total => it means we have error, exit with code 1
    process.exit(+!!total);
}
main();

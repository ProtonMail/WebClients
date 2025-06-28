import { Command } from 'commander';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';

import { logComponentCreationError, logConclusion, logIntro, logItemCompletion } from './utils/log';
import {
    appendAtomToIndex,
    getAtomTemplate,
    getIndexTemplate,
    getMdxTemplate,
    getStoriesTemplate,
    getStylesTemplate,
    getTestTemplate,
    getWriteTemplate,
} from './utils/templates';

const program = new Command();

async function run(AtomName: string, options: { tag: string }) {
    const { tag: rootHtmlTag } = options;

    logIntro(AtomName);

    const atomsDir = './src';
    const atomDir = `${atomsDir}/${AtomName}`;

    // Check to see if a directory at the given path exists
    if (fsSync.existsSync(path.resolve(atomDir))) {
        logComponentCreationError(AtomName);
        process.exit(0);
    }

    const [atomTemplate, indexTemplate, testTemplate, stylesTemplate, mdxTemplate, storiesTemplate] = await Promise.all(
        [
            getAtomTemplate(AtomName, rootHtmlTag),
            getIndexTemplate(AtomName),
            getTestTemplate(AtomName),
            getStylesTemplate(AtomName),
            getMdxTemplate(AtomName),
            getStoriesTemplate(AtomName),
        ]
    );

    await fs.mkdir(atomDir);
    logItemCompletion('Directory created.');

    const writeTemplate = getWriteTemplate(atomDir);
    await Promise.all([
        writeTemplate(`${AtomName}.tsx`, atomTemplate),
        writeTemplate('index.ts', indexTemplate),
        writeTemplate(`${AtomName}.test.tsx`, testTemplate),
        writeTemplate(`${AtomName}.scss`, stylesTemplate),
        writeTemplate(`${AtomName}.mdx`, mdxTemplate),
        writeTemplate(`${AtomName}.stories.tsx`, storiesTemplate),
        appendAtomToIndex(atomsDir, AtomName),
    ]);

    logConclusion();
}

async function main() {
    program
        .argument('<AtomName>', 'name of the atom to create')
        .option('-t, --tag <type>', 'the root html tag of the component', 'div')
        .action(run);
    await program.parseAsync(process.argv);
}

void main();

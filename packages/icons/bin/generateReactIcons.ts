import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { JSDOM } from 'jsdom';
import mustache from 'mustache';
import path from 'path';
import * as prettier from 'prettier';

function capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function camelize(str: string) {
    return str
        .replace(/(?:^\w|[A-Z]|[\b\-_]\w)/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase().replace('-', '').replace('_', '');
        })
        .replace(/\s+/g, '');
}

function convertToJsx(html: string): string {
    return html.replace(/<(\w+)([^>]*)\/?>/g, (_, tagName: string, attributes: string) => {
        // Convert attributes to camelCase
        const camelCaseAttributes = attributes
            .trim()
            .replace(/[\w-]+="[^"]*"/g, (attr) => {
                const [key, value] = attr.split('=');
                return `${camelize(key)}=${value}`;
            })
            .replace(/class=/, 'className=');
        return `<${tagName} ${camelCaseAttributes}>`;
    });
}

const disclaimer = `
/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn workspace @proton/icons build' to update the icons react components.
*/
`;

const iconsDir = path.join(__dirname, '../icons');

async function run() {
    const iconTemplate = await readFile(path.join(__dirname, './IconTemplate.tsx.mustache'), { encoding: 'utf-8' });

    const iconFile = await readFile('./assets/sprite-icons.svg', 'utf8');
    const iconNodes = Array.from(new JSDOM(iconFile).window.document.querySelectorAll('g[id]'));

    const icons = iconNodes.map((node) => {
        const iconName = capitalize(camelize(node.id));

        const renderedContent = mustache.render(iconTemplate, { iconName, innerHTML: convertToJsx(node.innerHTML) });

        return {
            name: iconName,
            content: [disclaimer, renderedContent].join('\n'),
        };
    });

    await rm(iconsDir, { recursive: true, force: true });
    await mkdir(iconsDir);

    const prettierOptions = (await prettier.resolveConfig(path.join(__dirname, '../../../prettier.config.mjs'))) || {};

    const writeFilesPromises = icons.map(async (icon) => {
        await writeFile(
            `${iconsDir}/${icon.name}.tsx`,
            await prettier.format(icon.content, { ...prettierOptions, parser: 'typescript' })
        );
    });

    const generateIndex = async () => {
        const index = [
            disclaimer,
            `export * from './types';`,
            '',
            `export type IconName = ${iconNodes.map((node) => `'${node.id.replace('ic-', '')}'`).join('|')}`,
            '',
            ...icons.map((icon) => `export { ${icon.name} } from './icons/${icon.name}';`),
        ].join('\n');

        await writeFile(
            path.join(__dirname, '../index.ts'),
            await prettier.format(index, { ...prettierOptions, parser: 'typescript' })
        );
    };
    writeFilesPromises.push(generateIndex());

    await Promise.all(writeFilesPromises);
}

void run();

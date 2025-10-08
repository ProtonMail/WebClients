import { JSDOM } from 'jsdom';
import mustache from 'mustache';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

import { ICON_PX_SIZES } from '../constants';

const dirname = path.dirname(fileURLToPath(import.meta.url));

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

const iconsDir = path.join(dirname, '../icons');

async function run() {
    const iconTemplate = await readFile(path.join(dirname, './IconTemplate.tsx.mustache'), { encoding: 'utf-8' });

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

    const prettierOptions = (await prettier.resolveConfig(path.join(dirname, '../../../prettier.config.mjs'))) || {};

    const writeFilesPromises = icons.map(async (icon) => {
        await writeFile(
            `${iconsDir}/${icon.name}.tsx`,
            await prettier.format(icon.content, { ...prettierOptions, parser: 'typescript' })
        );
    });

    const generateIndex = async () => {
        const content = [
            disclaimer,
            `export * from './types';`,
            '',
            ...icons.map((icon) => `export { ${icon.name} } from './icons/${icon.name}';`),
        ].join('\n');

        await writeFile(
            path.join(dirname, '../index.ts'),
            await prettier.format(content, { ...prettierOptions, parser: 'typescript' })
        );
    };

    const generateTypes = async () => {
        const content = [
            disclaimer,
            `export type IconSize = ${ICON_PX_SIZES.map((px) => `${px / 4} // ${px}px`).join('\n|')}`,
            '',
            `export type IconName = ${iconNodes.map((node) => `'${node.id.replace('ic-', '')}'`).join('|')}`,
        ].join('\n');

        await writeFile(
            path.join(dirname, '../types.ts'),
            await prettier.format(content, { ...prettierOptions, parser: 'typescript' })
        );
    };

    writeFilesPromises.push(generateIndex());
    writeFilesPromises.push(generateTypes());

    await Promise.all(writeFilesPromises);
}

void run();

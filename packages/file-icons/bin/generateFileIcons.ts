import { JSDOM } from 'jsdom';
import mustache from 'mustache';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const iconsDir = path.join(dirname, '../icons');
const packageJsonPath = path.join(dirname, '../package.json');

const PACKAGE_JSON_INDENT = 4;

const ASSETS = ['sm', 'md', 'lg'] as const;

// The source still lives in @proton/icons, whose sprite loaders use it. It moves here once they are gone.
const source = createRequire(import.meta.url).resolve('@proton/icons/assets/file-icons.svg');

const disclaimer = `
/*
 * This file is auto-generated. Do not modify it manually!
*/
`;

// The SVG to JSX helpers match `@proton/icons`' generator.
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

/** `style="mask-type: luminance"` becomes `style={{ maskType: 'luminance' }}`. */
function convertStyleToJsx(html: string): string {
    return html.replace(/style="([^"]*)"/g, (_, style: string) => {
        const entries = style
            .split(';')
            .map((declaration) => declaration.split(':').map((part) => part.trim()))
            .filter(([property]) => property)
            .map(([property, value]) => `${camelize(property)}: '${value}'`);
        return `style={{ ${entries.join(', ')} }}`;
    });
}

/**
 * The file icons are one `<g id="mime-{asset}-{name}">` per shape, each carrying its own gradient, mask and clip path
 * defs. One component per name renders all three shapes and picks one by size, as `MimeIcon` did with the sprite.
 */
async function generateMimeIcons(template: string) {
    const document = new JSDOM(await readFile(source, 'utf8')).window.document;
    const nodes = Array.from(document.querySelectorAll<SVGGElement>('defs > g[id^="mime-"]'));
    const names = [...new Set(nodes.map((node) => node.id.replace(/^mime-(sm|md|lg)-/, '')))];

    return names.map((name) => {
        const iconName = `Mime${capitalize(camelize(name))}`;
        let needsId = false;

        const shapes = Object.fromEntries(
            ASSETS.map((asset) => {
                const node = document.getElementById(`mime-${asset}-${name}`);
                if (!node) {
                    throw new Error(`Missing file icon mime-${asset}-${name}`);
                }

                const shape = node.cloneNode(true) as Element;
                shape.removeAttribute('id');

                // `id="mime-sm-proton-doc-mask"` and `"url(#mime-sm-proton-doc-mask)"` take the per-instance `id`.
                const defReference = new RegExp(`"(url\\(#)?mime-${asset}-${name}-([\\w-]+)(\\))?"`, 'g');
                const jsx = convertStyleToJsx(convertToJsx(shape.outerHTML)).replace(
                    defReference,
                    (_, url = '', def: string, close = '') => {
                        needsId = true;
                        return `{\`${url}\${id}-${asset}-${def}${close}\`}`;
                    }
                );

                return [asset, jsx];
            })
        );

        const content = mustache.render(template, { iconName, needsId, ...shapes });

        return { name: iconName, content: [disclaimer, content].join('\n') };
    });
}

/**
 * Writes one `exports` entry per generated component. Code wildcards are not allowed in export
 * maps (see `exports:validate` in `@proton/ci-scripts`). Hand-written entries keep their position
 * and order.
 */
async function writeIconExports(iconNames: string[]) {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    const handWritten = Object.entries(packageJson.exports ?? {}).filter(([key]) => !key.startsWith('./icons/'));
    const generated = [...iconNames].sort().map((name) => [`./icons/${name}`, `./icons/${name}.tsx`] as const);

    packageJson.exports = Object.fromEntries([...handWritten, ...generated]);

    await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, PACKAGE_JSON_INDENT)}\n`);
}

async function run() {
    const template = await readFile(path.join(dirname, './FileIconTemplate.tsx.mustache'), { encoding: 'utf-8' });
    const icons = await generateMimeIcons(template);

    await rm(iconsDir, { recursive: true, force: true });
    await mkdir(iconsDir);

    const prettierOptions = (await prettier.resolveConfig(path.join(dirname, '../../../prettier.config.mjs'))) || {};

    await Promise.all([
        ...icons.map(async (icon) =>
            writeFile(
                `${iconsDir}/${icon.name}.tsx`,
                await prettier.format(icon.content, { ...prettierOptions, parser: 'typescript' })
            )
        ),
        writeIconExports(icons.map((icon) => icon.name)),
    ]);
}

void run();

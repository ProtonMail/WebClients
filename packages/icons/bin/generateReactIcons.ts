import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const icons = fs.readFileSync('./assets/sprite-icons.svg', 'utf8');

const iconNodes = Array.from(new JSDOM(icons).window.document.querySelectorAll('g[id]'));

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

const iconPropsType = `
import React from 'react';
type IconProps = React.SVGProps<SVGSVGElement>;
`;

const disclaimer = `/*
 * This file is auto-generated. Do not modify it manually!
 * Run 'yarn generate-icons' to update the icons react components.
*/`;

const modules = iconNodes.map((node) => {
    const iconName = camelize(node.id);

    return {
        name: iconName,
        content: [
            disclaimer,
            iconPropsType,
            `export const ${capitalize(iconName)} = (props: IconProps) => {
    return <svg aria-hidden="true" {...props}>
      ${convertToJsx(node.innerHTML)}
      </svg>;
  };`,
        ].join('\n'),
    };
});

const dest = 'tmp';

if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest);
}
modules.forEach((module) => {
    fs.writeFileSync(`${dest}/${module.name}.tsx`, module.content);
});

const index = modules.map((module) => `export * from './${module.name}';`).join('\n');

fs.writeFileSync(`${dest}/all.tsx`, index);

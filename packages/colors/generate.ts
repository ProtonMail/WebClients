import fs from 'fs';
import tiny from 'tinycolor2';
import prettier from 'prettier';
import { parse, walk, generate } from 'css-tree';

import genButtonShades from './gen-button-shades';

const baseThemeCssFile = fs.readFileSync('./themes/default.theme.base.css', { encoding: 'utf-8' });

const ast = parse(baseThemeCssFile);

const bases = ['--primary', '--signal-danger', '--signal-warning', '--signal-info', '--signal-success'];

walk(ast, (node, item, list) => {
    if (node.type === 'Declaration' && bases.includes(node.property)) {
        if (node.value.type !== 'Raw') {
            return;
        }

        const declarations = genButtonShades(tiny(node.value.value)).map((color, i) =>
            list.createItem({
                type: 'Declaration',
                important: false,
                property: '--primary-' + i,
                value: { type: 'Raw', value: color.toHexString() },
            })
        );

        declarations.reverse()

        if (!item.next) {
            for (const declaration of declarations) {
                list.append(declaration);
            }
        } else {
            for (const declaration of declarations) {
                list.insert(declaration, item.next);
            }
        }
    }
});

const css = prettier.format(generate(ast), { parser: 'css' });

fs.writeFileSync('./themes/default.theme.css', css);

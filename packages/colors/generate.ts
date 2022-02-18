import fs from 'fs';
import tiny from 'tinycolor2';
import prettier from 'prettier';
import cssTree from 'css-tree';

import genButtonShades from './gen-button-shades';

const buttonBases = [
    'primary',
    'signal-danger',
    'signal-warning',
    'signal-info',
    'signal-success'
];

const buttonShadeNames = [
    '-l2',
    '-l1',
    '',
    '-d1',
    '-d2',
    '-d3',
]

const baseThemeCssFile = fs.readFileSync('./themes/default.theme.base.css', { encoding: 'utf-8' });

const ast = cssTree.parse(baseThemeCssFile);

cssTree.walk(ast, (node, item, list) => {
    if (node.type !== 'Declaration') {
        return
    }

    if (node.value.type !== 'Raw') {
        return;
    }

    const baseName = node.property.substring(2)

    if (!buttonBases.includes(baseName)) {
        return
    }

    /*
     * make sure we don't visit the same base name again
     * by removing it fro the array of button base names
     */
    buttonBases.splice(buttonBases.indexOf(baseName), 1)

    const declarations = genButtonShades(tiny(node.value.value)).map(
        (color, i) =>
            list.createItem({
                type: 'Declaration',
                important: false,
                property: '--' + baseName + buttonShadeNames[i],
                value: { type: 'Raw', value: color.toHexString() }
            }
        )
    );

    if (!item.next) {
        for (const declaration of declarations) {
            list.append(declaration);
        }
    } else {
        /* list.insert() inserts after the next element so we reverse insertion order */
        for (let i = declarations.length - 1; i >= 0; i--) {
            list.insert(declarations[i], item.next);
        }
    }

    /* base is consumed, we don't need it any more and we don't want to re-visit */
    list.remove(item)
});

const css = prettier.format(cssTree.generate(ast), { parser: 'css' });

fs.writeFileSync('./themes/default.theme.css', css);

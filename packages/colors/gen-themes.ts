import fs from 'fs';
import tiny from 'tinycolor2';
import prettier from 'prettier';
import cssTree from 'css-tree';

import genButtonShades from './gen-button-shades';
import config, { ThemeConfig, ThemeFileType } from './themes.config'

function generateTheme ({ source, type }: { source: string, type: ThemeFileType }) {
    const buttonBases = [
        'primary',
        'signal-danger',
        'signal-warning',
        'signal-info',
        'signal-success',
        'interaction-norm',
        'interaction-weak',
        'background-norm'
    ];

    const buttonShadeNames = [
        '-l2',
        '-l1',
        '',
        '-d1',
        '-d2',
        '-d3',
    ]

    const ast = cssTree.parse(source);

    cssTree.walk(ast, (node, item, list) => {
        if (node.type !== 'Declaration') { return; }

        if (node.value.type !== 'Raw') { return; }

        const baseName = node.property.substring(2)

        if (!buttonBases.includes(baseName)) { return }

        /*
        * make sure we don't visit the same base name again
        * by removing it from the array of button base names
        */
        buttonBases.splice(buttonBases.indexOf(baseName), 1)

        const declarations = genButtonShades(tiny(node.value.value), type === 'light').map(
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

    return cssTree.generate(ast);
}

function main ({ output, files }: ThemeConfig) {
    const sources = files.map(
        ({ path, type }) => ({
            source: fs.readFileSync(path, { encoding: 'utf-8' }),
            type
        })
    )

    const generatedCssFiles = sources.map(generateTheme)

    const cssFile = generatedCssFiles.join('\n\n')

    const prettierCssFile = prettier.format(cssFile, { parser: 'css' })

    fs.writeFileSync(output, prettierCssFile)
}

config.forEach(main)

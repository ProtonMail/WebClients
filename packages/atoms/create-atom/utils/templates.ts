import fs from 'fs/promises';
import mustache from 'mustache';

import { logItemCompletion } from './log';
import prettify from './prettify';
import { toKebabCase } from './string';

const getTemplateFile = (templateName: string) =>
    fs.readFile(`./create-atom/templates/${templateName}`, { encoding: 'utf-8' });

// Use as follows - const writeTemplate = getWriteTemplate(atomDir)
export const getWriteTemplate = (atomDir: string) => async (fileName: string, template: string) => {
    await fs.writeFile(`${atomDir}/${fileName}`, template, { encoding: 'utf-8' });
    logItemCompletion(`${fileName} created.`);
};

export const getAtomTemplate = async (atomName: string, rootHtmlTag: string) => {
    const template = await getTemplateFile(`Atom.tsx.mustache`);
    return prettify(mustache.render(template, { atomName, rootHtmlTag }));
};

export const getTestTemplate = async (atomName: string) => {
    const template = await getTemplateFile(`Atom.test.tsx.mustache`);
    return prettify(mustache.render(template, { atomName }));
};

export const getStylesTemplate = async (atomName: string) => {
    const template = await getTemplateFile(`Atom.scss.mustache`);
    return prettify(mustache.render(template, { kebabCaseName: toKebabCase(atomName) }), 'scss');
};

export const getMdxTemplate = async (atomName: string) => {
    const template = await getTemplateFile(`Atom.mdx.mustache`);
    return prettify(mustache.render(template, { atomName, atomNameLowercase: atomName.toLowerCase() }), 'mdx');
};

export const getStoriesTemplate = async (atomName: string) => {
    const template = await getTemplateFile(`Atom.stories.tsx.mustache`);
    return prettify(mustache.render(template, { atomName }));
};

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export enum StorybookEntryType {
    STORY = 'story',
    DOCS = 'docs',
}

export type StoryEntry = {
    id: string;
    title: string;
    name: string;
    importPath: string;
    type: StorybookEntryType;
    componentPath?: string;
    tags: string[];
    storiesImports?: any[];
};

export type StorybookIndex = {
    v: number;
    entries: {
        [key: string]: StoryEntry;
    };
};

export function getStorybooIds() {
    const storybookStaticFolder = resolve(__dirname, '../storybook-static');

    if (!existsSync(storybookStaticFolder)) {
        throw new Error('storybook-static folder does not exist, try to run "yarn storybook:build" first.');
    }

    const content = readFileSync(resolve(storybookStaticFolder, './index.json'), 'utf-8');
    let parsedContent: StorybookIndex;

    try {
        parsedContent = JSON.parse(content) as StorybookIndex;
    } catch (err) {
        throw new Error('Storybook index.json is not valid JSON.');
    }

    const ids = Object.keys(parsedContent.entries).filter(
        (id: string) => parsedContent.entries[id].type.toLowerCase() === StorybookEntryType.STORY
    );

    return ids;
}

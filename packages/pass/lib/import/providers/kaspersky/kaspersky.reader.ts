import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import {
    type KasperskyItem,
    KasperskyItemKey,
    KasperskyItemKeys,
} from '@proton/pass/lib/import/providers/kaspersky/kaspersky.types';
import { type ImportPayload } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

const LOGIN_NAME_KEYS = [KasperskyItemKey.LOGIN_NAME, KasperskyItemKey.ACCOUNT_NAME, KasperskyItemKey.WEBSITE_NAME];

type LineReaderState = {
    items: KasperskyItem[];
    current: MaybeNull<KasperskyItem>;
    property: MaybeNull<KasperskyItemKey>;
};

const parseLine = (line: string): MaybeNull<[key: KasperskyItemKey, value: string]> => {
    const colonIndex = line.indexOf(':');

    if (colonIndex !== -1) {
        const prop = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        if (KasperskyItemKeys.includes(prop)) return [prop as KasperskyItemKey, value];
    }

    return null;
};

const processLine = (state: LineReaderState, line: string): LineReaderState => {
    const newSection = line.trim() === '---' || state.current === null;
    const parsedLine = parseLine(line);

    if (newSection) {
        /* If this is a new section, create a new item */
        const item: KasperskyItem = {};
        state.items.push(item);
        state.current = item;
        state.property = null;
    } else if (parsedLine && state.current) {
        /* if the line was successfully parsed, append
         * the new property to the current item */
        const [property, value] = parsedLine;
        state.current[property] = value.trim();
        state.property = property;
    } else if (state.property && state.current) {
        /* if we're dealing with a new line at this point,
         * append to the last seen property */
        const value = state.current[state.property];
        state.current[state.property] = `${value}\n${line}`;
    }

    return state;
};

export const readKasperskyData = ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): ImportPayload => {
    type KasperskyReaderResult = { items: ItemImportIntent[]; warnings: string[]; ignored: string[] };

    try {
        const reader = data
            .replace(/\n*---\n*/g, '\n---\n') // Normalize separators
            .replace(/\n*---\n*$/, '') // Remove trailing separator
            .split('\n')
            .reduce<LineReaderState>(processLine, { items: [], current: null, property: null });

        const { items, ignored, warnings } = reader.items.reduce<KasperskyReaderResult>(
            (result, item) => {
                if (KasperskyItemKey.LOGIN in item) {
                    const nameKey = LOGIN_NAME_KEYS.find((key) => key in item && item[key]);
                    const name = nameKey ? item[nameKey] : '';
                    const app = item[KasperskyItemKey.APPLICATION];
                    const note = item[KasperskyItemKey.COMMENT];
                    const email = item[KasperskyItemKey.LOGIN];
                    const password = item[KasperskyItemKey.PASSWORD];
                    const urls = [item[KasperskyItemKey.WEBSITE_URL] ?? []].flat();

                    result.items.push(
                        importLoginItem({
                            ...(importUsername ? getEmailOrUsername(email) : { email }),
                            name: app ? `${app} ${name}`.trim() : name,
                            note,
                            password,
                            urls,
                        })
                    );
                } else if (KasperskyItemKey.TEXT in item) {
                    const name = item[KasperskyItemKey.NAME];
                    const note = item[KasperskyItemKey.TEXT];

                    result.items.push(importNoteItem({ name, note }));
                } else result.ignored.push(Object.values(item).join('|').substring(0, 50));

                return result;
            },
            { items: [], ignored: [], warnings: [] }
        );

        return {
            vaults: [{ name: getImportedVaultName(), shareId: null, items }],
            ignored,
            warnings,
        };
    } catch (e) {
        logger.warn('[Importer::Kaspersky]', e);
        throw new ImportProviderError('Kaspersky', e);
    }
};

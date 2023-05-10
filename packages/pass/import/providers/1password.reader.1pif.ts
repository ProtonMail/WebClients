import { c } from 'ttag';

import { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import {
    OnePassLegacyItem,
    OnePassLegacyItemType,
    OnePassLegacySectionFieldKey,
    OnePassLegacyURL,
} from './1password.1pif.types';
import { OnePassLoginDesignation } from './1password.1pux.types';

const extractFullNote = (item: OnePassLegacyItem): string => {
    let note = item.secureContents?.notesPlain || '';
    if (item.secureContents?.sections !== undefined) {
        item.secureContents.sections.forEach((section) => {
            let isSectionTitleAdded = false;
            if (section.fields !== undefined) {
                section.fields.forEach((field) => {
                    let fieldValue = undefined;
                    if (
                        (field.k === OnePassLegacySectionFieldKey.STRING ||
                            field.k === OnePassLegacySectionFieldKey.URL) &&
                        field.v !== undefined
                    ) {
                        fieldValue = field.v;
                    }
                    if (fieldValue !== undefined) {
                        if (!isSectionTitleAdded) {
                            note += `\n`; // separate sections with an empty line
                            if (section.title) {
                                note += `\n${section.title}`;
                            }
                            isSectionTitleAdded = true;
                        }
                        if (field.t) {
                            note += `\n${field.t}`;
                        }
                        note += `\n${fieldValue}`;
                    }
                });
            }
        });
    }

    return note;
};

const extractURLs = (item: OnePassLegacyItem): string[] => {
    if (item.secureContents?.URLs !== undefined) {
        return item.secureContents.URLs.map((u: OnePassLegacyURL) => {
            const { valid, url } = isValidURL(u.url);
            return valid ? new URL(url).origin : undefined;
        }).filter(Boolean) as string[];
    } else {
        return [];
    }
};

const extractTOTPs = (item: OnePassLegacyItem): string[] =>
    (item.secureContents.sections ?? []).flatMap(({ fields }) =>
        (fields ?? [])
            .flatMap((field) => (field.n.startsWith('TOTP') ? field.v ?? [] : []))
            .map((totp) => parseOTPValue(totp, { label: item.title }))
    );

const processLoginItem = (
    // item: Extract<OnePassLegacyItem, { typeName: OnePassLegacyItemType.LOGIN }>
    item: OnePassLegacyItem
): ItemImportIntent<'login'> => {
    let username = '';
    let password = '';
    const note = extractFullNote(item);
    const urls = extractURLs(item);
    const [totp, ...totps] = extractTOTPs(item);
    if (item.secureContents !== undefined) {
        if (item.secureContents.fields !== undefined) {
            item.secureContents.fields.forEach((onePassLegacyField) => {
                if (onePassLegacyField.designation) {
                    switch (onePassLegacyField.designation) {
                        case OnePassLoginDesignation.USERNAME:
                            username = onePassLegacyField.value;
                            break;
                        case OnePassLoginDesignation.PASSWORD:
                            password = onePassLegacyField.value;
                            break;
                        default:
                        // fields that are not username or password are ignored
                    }
                }
            });
        }
    }

    return {
        type: 'login',
        metadata: {
            name: item.title || 'Unnamed item',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {
            username: username,
            password: password,
            urls: urls,
            totpUri: totp ?? '',
        },
        extraFields: totps.map((totpUri) => ({ fieldName: 'totp', content: { oneofKind: 'totp', totp: { totpUri } } })),
        trashed: false,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};

const processNoteItem = (item: OnePassLegacyItem): ItemImportIntent<'note'> => {
    const note = extractFullNote(item);

    return {
        type: 'note',
        metadata: {
            name: item.title || 'Unnamed note',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {},
        extraFields: [],
        trashed: false,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};

const processPasswordItem = (item: OnePassLegacyItem): ItemImportIntent<'login'> => {
    const urls = extractURLs(item);
    const note = extractFullNote(item);
    const [totp, ...totps] = extractTOTPs(item);

    return {
        type: 'login',
        metadata: {
            name: item.title || 'Unnamed item',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {
            username: '',
            password: item.secureContents?.password || '',
            urls: urls,
            totpUri: totp ?? '',
        },
        extraFields: totps.map((totpUri) => ({ fieldName: 'totp', content: { oneofKind: 'totp', totp: { totpUri } } })),
        trashed: false,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};

export const parse1PifData = (data: string): OnePassLegacyItem[] =>
    data
        .split('\n')
        .filter((line) => !line.startsWith('***') && Boolean(line))
        .map((rawItem) => JSON.parse(rawItem));

export const read1Password1PifData = async (data: string): Promise<ImportPayload> => {
    try {
        const ignored: string[] = [];
        const items: ItemImportIntent[] = parse1PifData(data)
            .map((item) => {
                switch (item.typeName) {
                    case OnePassLegacyItemType.LOGIN:
                        return processLoginItem(item);
                    case OnePassLegacyItemType.NOTE:
                        return processNoteItem(item);
                    case OnePassLegacyItemType.PASSWORD:
                        return processPasswordItem(item);
                    default:
                        ignored.push(`[${item.typeName}] ${item.title ?? ''}`);
                }
            })
            .filter(truthy);

        const vaults: ImportVault[] = [
            {
                type: 'new',
                vaultName: c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`,
                id: uniqueId(),
                items: items,
            },
        ];

        return { vaults, ignored };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`1Password export file could not be parsed. ${errorDetail}`);
    }
};

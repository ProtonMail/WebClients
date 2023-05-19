import { c } from 'ttag';

import type { ItemImportIntent } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import type { OnePassLegacyItem, OnePassLegacySectionField, OnePassLegacyURL } from './1password.1pif.types';
import { OnePassLegacyItemType, OnePassLegacySectionFieldKey } from './1password.1pif.types';
import { OnePassLoginDesignation } from './1password.1pux.types';

const ENTRY_SEPARATOR_1PIF = '***';

const isNoteSectionField = ({ k: key }: OnePassLegacySectionField) =>
    key === OnePassLegacySectionFieldKey.STRING || key === OnePassLegacySectionFieldKey.URL;

const extractFullNote = (item: OnePassLegacyItem): string => {
    const base = item.secureContents?.notesPlain;

    return (item.secureContents.sections ?? [])
        .reduce<string>(
            (fullNote, section) => {
                const hasNoteFields = section.fields?.some(isNoteSectionField);
                if (!hasNoteFields) return fullNote;

                if (section.title) fullNote += `${section.title}\n`;

                (section.fields ?? []).forEach((field, idx, fields) => {
                    const { t: subTitle, v: value } = field;
                    if (!isNoteSectionField(field)) return;

                    if (subTitle) fullNote += `${subTitle}\n`;
                    if (value) fullNote += `${value}\n${idx === fields.length - 1 ? '\n' : ''}`;
                });

                return fullNote;
            },
            base ? `${base}\n\n` : ''
        )
        .trim();
};

const extractURLs = (item: OnePassLegacyItem): string[] => {
    if (item.secureContents?.URLs === undefined) return [];

    return item.secureContents.URLs.map((u: OnePassLegacyURL) => {
        const { valid, url } = isValidURL(u.url);
        return valid ? new URL(url).origin : undefined;
    }).filter(truthy);
};

const extractTOTPs = (item: OnePassLegacyItem): string[] =>
    (item.secureContents.sections ?? []).flatMap(({ fields }) =>
        (fields ?? [])
            .flatMap((field) => (field.n.startsWith('TOTP') ? field.v ?? [] : []))
            .map((totp) => parseOTPValue(totp, { label: item.title }))
    );

const processLoginItem = (item: OnePassLegacyItem): ItemImportIntent<'login'> => {
    const fields = item.secureContents.fields;
    const username = fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value;
    const password = fields?.find(({ designation }) => designation === OnePassLoginDesignation.PASSWORD)?.value;
    const note = extractFullNote(item);
    const urls = extractURLs(item);
    const [totp, ...totps] = extractTOTPs(item);

    return {
        type: 'login',
        metadata: {
            name: item.title || 'Unnamed item',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {
            username: username ?? '',
            password: password ?? '',
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
        .filter((line) => !line.startsWith(ENTRY_SEPARATOR_1PIF) && Boolean(line))
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

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`1Password export file could not be parsed. ${errorDetail}`);
    }
};

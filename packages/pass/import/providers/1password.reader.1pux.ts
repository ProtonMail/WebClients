import jszip from 'jszip';
import { c } from 'ttag';

import type { ItemImportIntent, Maybe, Unpack } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import {
    OnePass1PuxData,
    OnePassBaseItem,
    OnePassCategory,
    OnePassItem,
    OnePassItemDetails,
    OnePassLoginDesignation,
    OnePassState,
} from './1password.1pux.types';

const OnePasswordTypeMap: Record<string, string> = {
    '001': 'Login',
    '002': 'Credit Card',
    '003': 'Note',
    '004': 'Identification',
    '005': 'Password',
};

const isNoteSectionField = (field: Unpack<Unpack<OnePassItemDetails['sections']>['fields']>) =>
    'string' in field.value || 'url' in field.value;

const extractFullNote = (details: OnePassItemDetails): string => {
    const base = details.notesPlain;
    return (details.sections ?? [])
        .reduce<string>(
            (fullNote, section) => {
                const hasNoteFields = section.fields?.some(isNoteSectionField);
                if (!hasNoteFields) return fullNote;

                if (section.title) fullNote += `${section.title}\n`;

                (section.fields ?? []).forEach((field, idx, fields) => {
                    if (!isNoteSectionField(field)) return;

                    const subTitle = field.title;
                    const value = field.value.string ?? field.value.url ?? '';
                    if (subTitle) fullNote += `${subTitle}\n`;
                    if (value) fullNote += `${value}\n${idx === fields.length - 1 ? '\n' : ''}`;
                });

                return fullNote;
            },
            base ? `${base}\n\n` : ''
        )
        .trim();
};

const extractURLs = (item: OnePassItem): string[] => [
    ...new Set(
        [item.overview.url, ...(item.overview.urls ?? []).map(({ url }) => url)]
            .map((uri) => {
                const { valid, url } = isValidURL(uri);
                return valid ? new URL(url).origin : undefined;
            })
            .filter(Boolean) as string[]
    ),
];

const extractTOTP = (item: OnePassItem): string[] =>
    (item.details.sections ?? []).flatMap(({ fields }) =>
        fields
            .map((field) => field.value.totp)
            .filter((totp): totp is string => totp !== undefined)
            .map((totp) => parseOTPValue(totp, { label: item.overview.title }))
    );

const processNoteItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.NOTE }>
): ItemImportIntent<'note'> => {
    const note = extractFullNote(item.details);
    return {
        type: 'note',
        metadata: {
            name: item.overview.title || 'Unnamed note',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {},
        extraFields: [],
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};

const extractLoginFieldFromLoginItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>,
    designation: OnePassLoginDesignation
): string => {
    const loginFields = item.details.loginFields;
    let value = '';
    loginFields.forEach((loginField) => {
        if (loginField.designation == designation) {
            value = loginField.value;
        }
    });
    return value;
};

const processLoginItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>
): ItemImportIntent<'login'> => {
    const note = extractFullNote(item.details);
    const urls = extractURLs(item);
    const [totp, ...totps] = extractTOTP(item);
    const username = extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.USERNAME);
    const password = extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.PASSWORD);

    return {
        type: 'login',
        metadata: {
            name: item.overview.title || 'Unnamed item',
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
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};
const processPasswordItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.PASSWORD }>
): Maybe<ItemImportIntent<'login'>> => {
    if (item.details.password === undefined) {
        return undefined;
    }

    const note = extractFullNote(item.details);
    const urls = extractURLs(item);

    return {
        type: 'login',
        metadata: {
            name: item.overview.title || 'Unnamed item',
            note: note,
            itemUuid: uniqueId(),
        },
        content: {
            username: '',
            password: item.details.password,
            urls: urls,
            totpUri: '',
        },
        extraFields: [],
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    };
};

export const read1Password1PuxData = async (data: ArrayBuffer): Promise<ImportPayload> => {
    try {
        const zipFile = await jszip.loadAsync(data);
        const zipObject = zipFile.file('export.data');
        const content = await zipObject?.async('string');

        if (content === undefined) {
            throw new Error('Unprocessable content');
        }

        const parsedData = JSON.parse(content) as OnePass1PuxData;
        const ignored: string[] = [];

        const vaults = parsedData.accounts.flatMap((account) =>
            account.vaults.map(
                (vault): ImportVault => ({
                    type: 'new',
                    vaultName: `${vault.attrs.name}`,
                    id: uniqueId(),
                    items: vault.items
                        .filter((item) => item.state !== OnePassState.TRASHED)
                        .map((item): Maybe<ItemImportIntent> => {
                            switch (item.categoryUuid) {
                                case OnePassCategory.LOGIN:
                                    return processLoginItem(item);
                                case OnePassCategory.NOTE:
                                    return processNoteItem(item);
                                case OnePassCategory.PASSWORD:
                                    return processPasswordItem(item);
                                default:
                                    const { categoryUuid, overview } = item as OnePassBaseItem;
                                    ignored.push(
                                        `[${OnePasswordTypeMap[categoryUuid] ?? 'Other'}] ${
                                            overview.title ?? overview.subtitle
                                        }`
                                    );
                            }
                        })
                        .filter(truthy),
                })
            )
        );

        return { vaults, ignored };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`1Password export file could not be parsed. ${errorDetail}`);
    }
};

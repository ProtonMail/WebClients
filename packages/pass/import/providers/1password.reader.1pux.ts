import jszip from 'jszip';
import { c } from 'ttag';
import uniqid from 'uniqid';

import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { isValidURL } from '@proton/pass/utils/url';

import { ImportReaderError } from '../helpers/reader.error';
import type { ImportPayload, ImportVault } from '../types';
import type { OnePass1PuxData, OnePassItem, OnePassItemDetails } from './1password.1pux.types';
import { OnePassCategory, OnePassLoginDesignation } from './1password.1pux.types';

const extractFullNote = (details: OnePassItemDetails): string => {
    let note = details.notesPlain || '';
    details.sections.forEach((section) => {
        let added = false;
        section.fields.forEach((field) => {
            let fieldValue = undefined;
            if (field.value.url !== undefined) {
                fieldValue = field.value.url;
            }
            if (field.value.text !== undefined) {
                fieldValue = field.value.text;
            }
            if (fieldValue !== undefined) {
                if (!added) {
                    note += `\n${section.title}`;
                    added = true;
                }
                if (field.title) {
                    note += `\n${field.title}`;
                }
                note += `\n${fieldValue}`;
            }
        });
    });

    return note;
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
            name: item.overview.title,
            note: note,
            itemUuid: uniqid(),
        },
        content: {},
        extraFields: [],
        trashed: false,
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
            name: item.overview.title,
            note: note,
            itemUuid: uniqid(),
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
            name: item.overview.title,
            note: note,
            itemUuid: uniqid(),
        },
        content: {
            username: '',
            password: item.details.password,
            urls: urls,
            totpUri: '',
        },
        extraFields: [],
        trashed: false,
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

        return parsedData.accounts.flatMap((account) =>
            account.vaults.map(
                (vault): ImportVault => ({
                    type: 'new',
                    vaultName: `${vault.attrs.name}`,
                    id: uniqid(),
                    items: vault.items
                        .map((item): Maybe<ItemImportIntent> => {
                            switch (item.categoryUuid) {
                                case OnePassCategory.LOGIN:
                                    return processLoginItem(item);
                                case OnePassCategory.NOTE:
                                    return processNoteItem(item);
                                case OnePassCategory.PASSWORD:
                                    return processPasswordItem(item);
                            }
                        })
                        .filter((item): item is ItemImportIntent => item !== undefined),
                })
            )
        );
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`1Password export file could not be parsed. ${errorDetail}`);
    }
};

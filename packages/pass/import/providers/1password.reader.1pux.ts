import jszip from 'jszip';
import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe, Unpack } from '@proton/pass/types';
import { extractFirst } from '@proton/pass/utils/array';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';

import { ImportProviderError } from '../helpers/error';
import { getImportedVaultName, importCreditCardItem, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type {
    OnePass1PuxData,
    OnePassBaseItem,
    OnePassField,
    OnePassItem,
    OnePassItemDetails,
} from './1password.1pux.types';
import {
    OnePassCategory,
    OnePassFieldIdCreditCard,
    OnePassFieldValueKey,
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

const formatMonthYear = (monthYear: Maybe<number>): string => {
    const monthYearString = String(monthYear);
    if (!monthYear || monthYearString.length !== 6) return '';
    return `${monthYearString.slice(4, 6)}${monthYearString.slice(0, 4)}`;
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

const extractURLs = ({ overview }: OnePassItem): string[] => [
    overview.url,
    ...(overview.urls ?? []).map(({ url }) => url),
];

const extractExtraFields = (item: OnePassItem) => {
    const fieldValueKeys = Object.values(OnePassFieldValueKey);
    const fieldIdsCC = Object.values(OnePassFieldIdCreditCard);

    return item.details.sections
        .filter(({ fields }) => Boolean(fields))
        .flatMap(({ fields }) =>
            fields.filter(
                ({ id, value }) =>
                    /* check that field value key is supported and remove any credit card fields */
                    fieldValueKeys.some((key) => key === Object.keys(value)[0]) &&
                    fieldIdsCC.some((ccId) => ccId !== id)
            )
        )
        .map<ItemExtraField>(({ title, value }) => {
            const valueKey = Object.keys(value)[0] as OnePassFieldValueKey;
            switch (valueKey) {
                case OnePassFieldValueKey.MONTH_YEAR:
                    return {
                        fieldName: title || c('Label').t`Text`,
                        type: 'text',
                        data: { content: formatMonthYear(value[valueKey]) ?? '' },
                    };
                case OnePassFieldValueKey.STRING:
                case OnePassFieldValueKey.URL:
                    return {
                        fieldName: title || c('Label').t`Text`,
                        type: 'text',
                        data: { content: value[valueKey] ?? '' },
                    };
                case OnePassFieldValueKey.TOTP:
                    return {
                        fieldName: title || c('Label').t`TOTP`,
                        type: 'totp',
                        data: { totpUri: value[valueKey] ?? '' },
                    };
                case OnePassFieldValueKey.CONCEALED:
                case OnePassFieldValueKey.CREDIT_CARD_NUMBER:
                    return {
                        fieldName: title || c('Label').t`Hidden`,
                        type: 'hidden',
                        data: { content: value[valueKey] ?? '' },
                    };
            }
        });
};

const processNoteItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.NOTE }>
): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.overview.title,
        note: extractFullNote(item.details),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
    });

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
    const [totp, extraFields] = extractFirst(
        extractExtraFields(item),
        (extraField): extraField is ItemExtraField<'totp'> => extraField.type === 'totp'
    );

    return importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        username: extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.USERNAME),
        password: extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.PASSWORD),
        urls: extractURLs(item),
        totp: totp?.data.totpUri,
        extraFields,
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });
};

const processPasswordItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.PASSWORD }>
): Maybe<ItemImportIntent<'login'>> => {
    if (item.details.password === undefined) return undefined;

    return importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        password: item.details.password,
        urls: extractURLs(item),
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });
};

const processCreditCardItem = (item: Extract<OnePassItem, { categoryUuid: OnePassCategory.CREDIT_CARD }>) => {
    const fieldIdsCC = Object.values(OnePassFieldIdCreditCard);

    const { cardholder, ccnum, cvv, expiry } = item.details.sections[0].fields.reduce<{
        [key in OnePassFieldIdCreditCard]?: OnePassField;
    }>((acc, field) => {
        if (fieldIdsCC.some((id) => id === field.id)) {
            acc[field.id as OnePassFieldIdCreditCard] = field;
        }
        return acc;
    }, {});

    return importCreditCardItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        cardholderName: cardholder?.value.string,
        number: ccnum?.value.creditCardNumber,
        verificationNumber: cvv?.value.concealed,
        expirationDate: formatMonthYear(expiry?.value.monthYear),
    });
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
                    name: getImportedVaultName(vault.attrs.name),
                    shareId: null,
                    items: vault.items
                        .filter((item) => item.state !== OnePassState.TRASHED)
                        .map((item): Maybe<ItemImportIntent> => {
                            switch (item.categoryUuid) {
                                case OnePassCategory.LOGIN:
                                    return processLoginItem(item);
                                case OnePassCategory.NOTE:
                                    return processNoteItem(item);
                                case OnePassCategory.CREDIT_CARD:
                                    return processCreditCardItem(item);
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

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        throw new ImportProviderError('1Password', e);
    }
};

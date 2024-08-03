import jszip from 'jszip';
import { c } from 'ttag';

import {
    build1PassIdentity,
    formatCCExpirationDate,
    getValue,
} from '@proton/pass/lib/import/builders/1password.builder';
import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { extractFirst } from '@proton/pass/utils/array/extract-first';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { objectKeys } from '@proton/pass/utils/object/generic';
import lastItem from '@proton/utils/lastItem';

import { ImportProviderError } from '../helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type {
    OnePass1PuxData,
    OnePassBaseItem,
    OnePassCreditCardFieldId,
    OnePassCreditCardFields,
    OnePassField,
    OnePassItem,
    OnePassItemDetails,
} from './1password.1pux.types';
import {
    OnePassCategory,
    OnePassCreditCardFieldIds,
    OnePassFieldKey,
    OnePassFieldValueKeys,
    OnePassLoginDesignation,
    OnePassState,
    OnePasswordTypeMap,
} from './1password.1pux.types';

const isNoteSectionField = ({ value }: OnePassField) => 'string' in value || 'url' in value;

const isSupportedField = ({ value }: OnePassField) =>
    OnePassFieldValueKeys.some((key) => key === Object.keys(value)[0]);

const isCreditCardField = (field: OnePassField): field is OnePassField & { id: OnePassCreditCardFieldId } =>
    OnePassCreditCardFieldIds.some((id) => id === field.id);

const extractFullNote = (details: OnePassItemDetails): string => {
    const base = details.notesPlain;

    return (details.sections ?? [])
        .reduce<string>(
            (fullNote, section) => {
                if (!section) return fullNote;

                const hasNoteFields = section.fields.some(isNoteSectionField);
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

const extractExtraFields = (item: OnePassItem): UnsafeItemExtraField[] => {
    const { sections } = item.details;
    if (!sections) return [];

    return (
        sections
            /* check that field value key is supported and remove any credit card fields */
            .flatMap(({ fields }) => fields.filter((field) => isSupportedField(field) && !isCreditCardField(field)))
            .map<UnsafeItemExtraField>(({ title, value }) => {
                const [valueKey] = objectKeys<OnePassFieldKey>(value);
                const content = getValue(value, valueKey);
                switch (valueKey) {
                    case OnePassFieldKey.MONTH_YEAR:
                    case OnePassFieldKey.STRING:
                    case OnePassFieldKey.URL:
                        return {
                            fieldName: title || c('Label').t`Text`,
                            type: 'text',
                            data: { content },
                        };
                    case OnePassFieldKey.TOTP:
                        return {
                            fieldName: title || c('Label').t`TOTP`,
                            type: 'totp',
                            data: { totpUri: content },
                        };
                    case OnePassFieldKey.CONCEALED:
                    case OnePassFieldKey.CREDIT_CARD_NUMBER:
                        return {
                            fieldName: title || c('Label').t`Hidden`,
                            type: 'hidden',
                            data: { content },
                        };
                }
            })
    );
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
): string => lastItem(item.details.loginFields.filter((field) => field.designation === designation))?.value ?? '';

const processLoginItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>,
    importUsername?: boolean
): ItemImportIntent<'login'> => {
    const [totp, extraFields] = extractFirst(
        extractExtraFields(item),
        (extraField): extraField is UnsafeItemExtraField<'totp'> => extraField.type === 'totp'
    );

    return importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        ...(importUsername
            ? getEmailOrUsername(extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.USERNAME))
            : { email: extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.USERNAME) }),
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

const processIdentityItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.IDENTITY }>
): Maybe<ItemImportIntent<'identity'>> =>
    importIdentityItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        ...build1PassIdentity(item.details.sections),
    });

const processCreditCardItem = (item: Extract<OnePassItem, { categoryUuid: OnePassCategory.CREDIT_CARD }>) => {
    const { cardholder, ccnum, cvv, expiry, pin } = ((): OnePassCreditCardFields => {
        const { sections } = item.details;
        if (!sections || sections.length === 0) return {};

        return sections
            .flatMap((s) => s.fields)
            .reduce<OnePassCreditCardFields>((acc, field) => {
                if (isCreditCardField(field)) acc[field.id] = field;
                return acc;
            }, {});
    })();

    return importCreditCardItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
        cardholderName: cardholder?.value.string,
        number: ccnum?.value.creditCardNumber,
        verificationNumber: cvv?.value.concealed,
        expirationDate: formatCCExpirationDate(expiry?.value.monthYear),
        pin: pin?.value.concealed,
    });
};

export const read1Password1PuxData = async ({
    data,
    importUsername,
}: {
    data: ArrayBuffer;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
    try {
        const zipFile = await jszip.loadAsync(data);
        const zipObject = zipFile.file('export.data');
        const content = await zipObject?.async('string');

        if (content === undefined) throw new Error('Unprocessable content');

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
                                    return processLoginItem(item, importUsername);
                                case OnePassCategory.NOTE:
                                    return processNoteItem(item);
                                case OnePassCategory.CREDIT_CARD:
                                    return processCreditCardItem(item);
                                case OnePassCategory.PASSWORD:
                                    return processPasswordItem(item);
                                case OnePassCategory.IDENTITY:
                                    return processIdentityItem(item);
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

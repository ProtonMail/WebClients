import jszip from 'jszip';
import { c } from 'ttag';

import { ImportProviderError } from '@proton/pass/lib/import/helpers/error';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importIdentityItem,
    importLoginItem,
    importNoteItem,
} from '@proton/pass/lib/import/helpers/transformers';
import type { ImportPayload, ImportVault } from '@proton/pass/lib/import/types';
import type { ItemImportIntent, Maybe, UnsafeItemExtraField } from '@proton/pass/types';
import { extractFirst } from '@proton/pass/utils/array/extract-first';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

import {
    extract1PasswordExtraFields,
    extract1PasswordIdentity,
    extract1PasswordLoginField,
    extract1PasswordNote,
    extract1PasswordURLs,
    format1PasswordMonthYear,
    is1PasswordCCField,
} from './1p.utils';
import type { OnePass1PuxData, OnePassCreditCardFields, OnePassItem } from './1pux.types';
import { OnePassCategory, OnePassLoginDesignation, OnePassState, OnePasswordTypeMap } from './1pux.types';

const processNoteItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.NOTE }>
): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.overview.title,
        note: extract1PasswordNote(item.details),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        trashed: item.state === OnePassState.ARCHIVED,
    });

const processLoginItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.LOGIN }>
): ItemImportIntent<'login'> => {
    const [totp, extraFields] = extractFirst(
        extract1PasswordExtraFields(item),
        (extraField): extraField is UnsafeItemExtraField<'totp'> => extraField.type === 'totp'
    );

    return importLoginItem({
        name: item.overview.title,
        note: item.details.notesPlain,
        ...getEmailOrUsername(extract1PasswordLoginField(item, OnePassLoginDesignation.USERNAME)),
        password: extract1PasswordLoginField(item, OnePassLoginDesignation.PASSWORD),
        urls: extract1PasswordURLs(item),
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
        urls: extract1PasswordURLs(item),
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
        ...extract1PasswordIdentity(item.details.sections),
    });

const processCreditCardItem = (item: Extract<OnePassItem, { categoryUuid: OnePassCategory.CREDIT_CARD }>) => {
    const { cardholder, ccnum, cvv, expiry, pin } = ((): OnePassCreditCardFields => {
        const { sections } = item.details;
        if (!sections || sections.length === 0) return {};

        return sections
            .flatMap((s) => s.fields)
            .reduce<OnePassCreditCardFields>((acc, field) => {
                if (is1PasswordCCField(field)) acc[field.id] = field;
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
        expirationDate: format1PasswordMonthYear(expiry?.value.monthYear),
        pin: pin?.value.concealed,
    });
};

export const read1Password1PuxData = async ({ data }: { data: ArrayBuffer }): Promise<ImportPayload> => {
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
                            const category = item?.categoryUuid;
                            const type = (category ? OnePasswordTypeMap[category] : null) ?? c('Label').t`Unknown`;
                            const title = item?.overview?.title ?? item?.overview?.subtitle ?? '';

                            try {
                                switch (item.categoryUuid) {
                                    case OnePassCategory.LOGIN:
                                        return processLoginItem(item);
                                    case OnePassCategory.NOTE:
                                        return processNoteItem(item);
                                    case OnePassCategory.CREDIT_CARD:
                                        return processCreditCardItem(item);
                                    case OnePassCategory.PASSWORD:
                                        return processPasswordItem(item);
                                    case OnePassCategory.IDENTITY:
                                        return processIdentityItem(item);
                                    default:
                                        ignored.push(`[${type}] ${title}`);
                                }
                            } catch (err) {
                                ignored.push(`[${type}] ${title}`);
                                logger.warn('[Importer::1Password::1pux]', err);
                            }
                        })
                        .filter(truthy),
                })
            )
        );

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password::1pux]', e);
        throw new ImportProviderError('1Password', e);
    }
};

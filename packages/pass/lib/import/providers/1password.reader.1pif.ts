import { c } from 'ttag';

import { build1PassLegacyIdentity } from '@proton/pass/lib/import/builders/1password.builder';
import type { ItemImportIntent, UnsafeItemExtraField } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

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
    return item.secureContents.URLs.map(({ url }: OnePassLegacyURL) => url);
};

const extractExtraFields = (item: OnePassLegacyItem) => {
    return item.secureContents.sections
        ?.filter(({ fields }) => Boolean(fields))
        .flatMap(({ fields }) =>
            (fields as OnePassLegacySectionField[])
                .filter(({ k }) => Object.values(OnePassLegacySectionFieldKey).includes(k))
                .map<UnsafeItemExtraField>(({ k, t, v, n }) => {
                    switch (k) {
                        case OnePassLegacySectionFieldKey.STRING:
                        case OnePassLegacySectionFieldKey.URL:
                            return {
                                fieldName: t || c('Label').t`Text`,
                                type: 'text',
                                data: { content: v ?? '' },
                            };
                        case OnePassLegacySectionFieldKey.CONCEALED:
                            if (n.startsWith('TOTP')) {
                                return {
                                    fieldName: t || c('Label').t`TOTP`,
                                    type: 'totp',
                                    data: { totpUri: v ?? '' },
                                };
                            }
                            return {
                                // translator: label for a field that is hidden. Singular only.
                                fieldName: t || c('Label').t`Hidden`,
                                type: 'hidden',
                                data: { content: v ?? '' },
                            };
                    }
                })
        );
};

const processLoginItem = (item: OnePassLegacyItem, importUsername?: boolean): ItemImportIntent<'login'> => {
    const fields = item.secureContents.fields;

    return importLoginItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        ...(importUsername
            ? getEmailOrUsername(
                  fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value
              )
            : { email: fields?.find(({ designation }) => designation === OnePassLoginDesignation.USERNAME)?.value }),
        password: fields?.find(({ designation }) => designation === OnePassLoginDesignation.PASSWORD)?.value,
        urls: extractURLs(item),
        extraFields: extractExtraFields(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });
};

const processNoteItem = (item: OnePassLegacyItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: extractFullNote(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });

const processPasswordItem = (item: OnePassLegacyItem): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.title,
        note: item.secureContents?.notesPlain,
        password: item.secureContents?.password,
        urls: extractURLs(item),
        extraFields: extractExtraFields(item),
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });

const processCreditCardItem = (item: OnePassLegacyItem): ItemImportIntent<'creditCard'> => {
    const expirationDate =
        item.secureContents.expiry_mm && item.secureContents.expiry_yy
            ? `${String(item.secureContents.expiry_mm).padStart(2, '0')}${item.secureContents.expiry_yy}`
            : undefined;

    return importCreditCardItem({
        name: item.title,
        note: item.secureContents.notesPlain,
        cardholderName: item.secureContents.cardholder,
        number: item.secureContents.ccnum,
        verificationNumber: item.secureContents.cvv,
        expirationDate,
        pin: item.secureContents.pin,
    });
};

const processIdentityItem = (item: OnePassLegacyItem): ItemImportIntent<'identity'> =>
    importIdentityItem({
        name: item.title,
        note: item.secureContents.notesPlain,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
        ...build1PassLegacyIdentity(item.secureContents.sections),
    });

export const parse1PifData = (data: string): OnePassLegacyItem[] =>
    data
        .split('\n')
        .filter((line) => !line.startsWith(ENTRY_SEPARATOR_1PIF) && Boolean(line))
        .map((rawItem) => JSON.parse(rawItem));

export const read1Password1PifData = async ({
    data,
    importUsername,
}: {
    data: string;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
    try {
        const ignored: string[] = [];
        const items: ItemImportIntent[] = parse1PifData(data)
            .map((item) => {
                switch (item.typeName) {
                    case OnePassLegacyItemType.LOGIN:
                        return processLoginItem(item, importUsername);
                    case OnePassLegacyItemType.NOTE:
                        return processNoteItem(item);
                    case OnePassLegacyItemType.PASSWORD:
                        return processPasswordItem(item);
                    case OnePassLegacyItemType.CREDIT_CARD:
                        return processCreditCardItem(item);
                    case OnePassLegacyItemType.IDENTITY:
                        return processIdentityItem(item);
                    default:
                        ignored.push(`[${item.typeName}] ${item.title ?? ''}`);
                }
            })
            .filter(truthy);

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: items,
            },
        ];

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        throw new ImportProviderError('1Password', e);
    }
};

import jszip from 'jszip';
import { c } from 'ttag';

import type { ItemImportIntent, Maybe, Unpack } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string';

import { ImportReaderError } from '../helpers/reader.error';
import { getImportedVaultName, importLoginItem, importNoteItem } from '../helpers/transformers';
import type { ImportPayload, ImportVault } from '../types';
import type { OnePass1PuxData, OnePassBaseItem, OnePassItem, OnePassItemDetails } from './1password.1pux.types';
import { OnePassCategory, OnePassLoginDesignation, OnePassState } from './1password.1pux.types';

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

const extractURLs = ({ overview }: OnePassItem): string[] => [
    overview.url,
    ...(overview.urls ?? []).map(({ url }) => url),
];
const extractTOTPs = ({ details }: OnePassItem): string[] =>
    (details.sections ?? []).flatMap(({ fields }) => fields.map((field) => field.value.totp).filter(truthy));

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
): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.overview.title,
        note: extractFullNote(item.details),
        username: extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.USERNAME),
        password: extractLoginFieldFromLoginItem(item, OnePassLoginDesignation.PASSWORD),
        urls: extractURLs(item),
        totps: extractTOTPs(item),
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
    });

const processPasswordItem = (
    item: Extract<OnePassItem, { categoryUuid: OnePassCategory.PASSWORD }>
): Maybe<ItemImportIntent<'login'>> => {
    if (item.details.password === undefined) return undefined;

    return importLoginItem({
        name: item.overview.title,
        note: extractFullNote(item.details),
        password: item.details.password,
        urls: extractURLs(item),
        trashed: item.state === OnePassState.ARCHIVED,
        createTime: item.createdAt,
        modifyTime: item.updatedAt,
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
                    type: 'new',
                    vaultName: getImportedVaultName(vault.attrs.name),
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

        return { vaults, ignored, warnings: [] };
    } catch (e) {
        logger.warn('[Importer::1Password]', e);
        const errorDetail = e instanceof ImportReaderError ? e.message : '';
        throw new ImportReaderError(c('Error').t`1Password export file could not be parsed. ${errorDetail}`);
    }
};

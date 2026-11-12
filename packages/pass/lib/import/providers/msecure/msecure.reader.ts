import { c } from 'ttag';

import type { DeobfuscatedItemExtraField } from '../../../../types/data/items';
import type { ItemImportIntent } from '../../../../types/data/items.dto';
import type { Maybe } from '../../../../types/utils';
import { logger } from '../../../../utils/logger';
import { readCSV } from '../../helpers/csv.reader';
import { ImportProviderError } from '../../helpers/error';
import { createImportFolderTree } from '../../helpers/folders';
import {
    getEmailOrUsername,
    getImportedVaultName,
    importCreditCardItem,
    importLoginItem,
    importNoteItem,
} from '../../helpers/transformers';
import type { ImportReaderResult, ImportVault } from '../../types';
import type { MSecureField, MSecureItem } from './msecure.types';
import { MSecureFieldType } from './msecure.types';

const FIELD_SEPARATOR = '|';
const CREDIT_CARD_TEMPLATE = 'credit card';
const EXPORT_HEADER = /^msecure\d* csv export file$/i;
const CARD_LABELS = {
    verificationNumber: ['security code', 'code de sécurité'],
    cardholderName: ['name on card', 'nom sur la carte'],
    pin: ['pin', 'code pin'],
};
const LOGIN_TEMPLATES = ['login', 'web logins'];

const parseField = (cell: string): Maybe<MSecureField> => {
    const [label, type, ...value] = cell.split(FIELD_SEPARATOR);
    if (!label || type === undefined || value.length === 0) return;
    return { label: label.trim(), type: Number(type), value: value.join(FIELD_SEPARATOR).trim() };
};

const parseName = (nameAndId: string) => {
    const separatorIndex = nameAndId.lastIndexOf(FIELD_SEPARATOR);
    return (separatorIndex === -1 ? nameAndId : nameAndId.slice(0, separatorIndex)).trim();
};

const parseRow = ([nameAndId = '', template = '', tag = '', note = '', ...cells]: string[]): MSecureItem => ({
    name: parseName(nameAndId),
    template: template.trim(),
    tag: tag.trim(),
    note: note.replaceAll('\\n', '\n').trim(),
    fields: cells.map(parseField).filter((field): field is MSecureField => field !== undefined),
});

const isExportHeader = (row: string[]) => row.length === 1 && EXPORT_HEADER.test(row[0].trim());

const getFilledFields = ({ fields }: MSecureItem) => fields.filter(({ value }) => value !== '');

const isSecret = ({ type }: MSecureField) => type === MSecureFieldType.PASSWORD || type === MSecureFieldType.SECRET;

const toExtraField = (field: MSecureField): DeobfuscatedItemExtraField => ({
    fieldName: field.label,
    type: isSecret(field) ? 'hidden' : 'text',
    data: { content: field.value },
});

/** mSecure expiration dates are `MM/YYYY` or `MM/00YY`, Pass expects `MMYYYY` */
const formatMSecureExpirationDate = (value: string): Maybe<string> => {
    const match = value.match(/^(\d{1,2})\/(\d{2,4})$/);
    if (!match) return;

    const [, month, year] = match;
    const fullYear = Number(year) < 100 ? 2000 + Number(year) : Number(year);
    return `${month.padStart(2, '0')}${fullYear}`;
};

const processLoginItem = async (item: MSecureItem): Promise<ItemImportIntent<'login'>> => {
    const fields = getFilledFields(item);
    const urls = fields.filter(({ type }) => type === MSecureFieldType.WEBSITE);
    const usernames = fields.filter(({ type }) => type === MSecureFieldType.USERNAME);
    const passwords = fields.filter(({ type }) => type === MSecureFieldType.PASSWORD);

    const [username] = usernames;
    const [password] = passwords;
    const consumed = new Set<MSecureField>([...urls, username, password]);

    return importLoginItem({
        name: item.name,
        note: item.note,
        urls: urls.map(({ value }) => value),
        password: password?.value,
        extraFields: fields.filter((field) => !consumed.has(field)).map(toExtraField),
        ...(await getEmailOrUsername(username?.value)),
    });
};

/** Field order of the current card template, the same in every app language */
const CARD_LAYOUT = [
    MSecureFieldType.CARD_NUMBER,
    MSecureFieldType.DATE,
    MSecureFieldType.SECRET,
    MSecureFieldType.TEXT,
    MSecureFieldType.SECRET,
];

const hasCardLayout = ({ fields }: MSecureItem) => CARD_LAYOUT.every((type, index) => fields[index]?.type === type);

const processCreditCardItem = (item: MSecureItem): ItemImportIntent<'creditCard'> => {
    const remaining = getFilledFields(item);

    const take = (match: (field: MSecureField) => boolean): Maybe<string> => {
        const index = remaining.findIndex(match);
        return index === -1 ? undefined : remaining.splice(index, 1)[0].value;
    };

    const takeByLabel = (labels: string[]) => take(({ label }) => labels.includes(label.toLowerCase()));
    const takeByPosition = (position: number) => take((field) => field === item.fields[position]);

    /** Labels are translated: position is reliable on the current layout, labels cover older layouts */
    const takeCardField = (position: number, labels: string[]) =>
        hasCardLayout(item) ? takeByPosition(position) : takeByLabel(labels);

    const number = take(({ type }) => type === MSecureFieldType.CARD_NUMBER);
    const rawExpirationDate = take(
        ({ type, value }) => type === MSecureFieldType.DATE && formatMSecureExpirationDate(value) !== undefined
    );

    return importCreditCardItem({
        name: item.name,
        note: item.note,
        number,
        expirationDate: rawExpirationDate ? formatMSecureExpirationDate(rawExpirationDate) : undefined,
        verificationNumber: takeCardField(2, CARD_LABELS.verificationNumber),
        cardholderName: takeCardField(3, CARD_LABELS.cardholderName),
        pin: takeCardField(4, CARD_LABELS.pin),
        extraFields: remaining.map(toExtraField),
    });
};

const processNoteItem = (item: MSecureItem): ItemImportIntent<'note'> =>
    importNoteItem({ name: item.name, note: item.note, extraFields: getFilledFields(item).map(toExtraField) });

const hasFieldType = (item: MSecureItem, fieldType: MSecureFieldType) =>
    item.fields.some(({ type }) => type === fieldType);

/** Template names and field labels follow the mSecure app language: detect the
 * item kind from field types, which do not change with the language. */
const isCreditCard = (item: MSecureItem) =>
    item.template.toLowerCase() === CREDIT_CARD_TEMPLATE || hasFieldType(item, MSecureFieldType.CARD_NUMBER);

const isLogin = (item: MSecureItem) =>
    LOGIN_TEMPLATES.includes(item.template.toLowerCase()) ||
    hasFieldType(item, MSecureFieldType.USERNAME) ||
    (hasFieldType(item, MSecureFieldType.WEBSITE) && hasFieldType(item, MSecureFieldType.PASSWORD));

const processItem = async (item: MSecureItem): Promise<ItemImportIntent> => {
    if (isCreditCard(item)) return processCreditCardItem(item);
    if (isLogin(item)) return processLoginItem(item);
    return processNoteItem(item);
};

export const readMSecureData = async (file: File): Promise<ImportReaderResult> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const data = await file.text();
        const result = await readCSV<string[]>({ data, onError: (error) => warnings.push(error) });

        const tree = createImportFolderTree();
        const items: ItemImportIntent[] = [];

        for (const row of result.items.filter((row) => !isExportHeader(row))) {
            const item = parseRow(row);

            try {
                const folderId = tree.add(item.tag);
                items.push({ ...(await processItem(item)), folderId });
            } catch (err) {
                ignored.push(`[${item.template || c('Label').t`Unknown`}] ${item.name}`);
                logger.warn('[Importer::mSecure]', err);
            }
        }

        const vaults: ImportVault[] = [{ name: getImportedVaultName(), shareId: null, folders: tree.folders, items }];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::mSecure]', e);
        throw new ImportProviderError('mSecure', e);
    }
};

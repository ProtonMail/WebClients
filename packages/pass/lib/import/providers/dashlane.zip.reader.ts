import jszip from 'jszip';

import { FileKey, buildDashlaneIdentity, groupItems } from '@proton/pass/lib/import/builders/dashlane.builder';
import type { ItemImportIntent, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { readCSV } from '../helpers/csv.reader';
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
    DashlaneIdItem,
    DashlaneItem,
    DashlaneLoginItem,
    DashlaneNoteItem,
    DashlanePaymentItem,
    DashlanePersonalInfoItem,
} from './dashlane.types';

export const DASHLANE_LOGINS_EXPECTED_HEADERS: (keyof DashlaneLoginItem)[] = [
    'username',
    'title',
    'password',
    'note',
    'url',
    'category',
    'otpSecret',
];

const DASHLANE_NOTES_EXPECTED_HEADERS: (keyof DashlaneNoteItem)[] = ['title', 'note'];

const DASHLANE_CREDIT_CARDS_EXPECTED_HEADERS: (keyof DashlanePaymentItem)[] = [
    'type',
    'account_name',
    'cc_number',
    'code',
    'expiration_month',
    'expiration_year',
];

const DASHLANE_IDS_EXPECTED_HEADERS: (keyof DashlaneIdItem)[] = [
    'type',
    'number',
    'name',
    'issue_date',
    'expiration_date',
    'place_of_issue',
    'state',
];

const DASHLANE_PERSONAL_INFO_EXPECTED_HEADERS: (keyof DashlanePersonalInfoItem)[] = [
    'type',
    'address',
    'address_apartment',
    'address_building',
    'address_door_code',
    'address_floor',
    'address_recipient',
    'city',
    'country',
    'date_of_birth',
    'email',
    'email_type',
    'first_name',
    'item_name',
    'job_title',
    'last_name',
    'login',
    'middle_name',
    'phone_number',
    'place_of_birth',
    'state',
    'title',
    'url',
    'zip',
];

export const processLoginItem = (item: DashlaneLoginItem, importUsername?: boolean): ItemImportIntent<'login'> =>
    importLoginItem({
        name: item.title,
        note: item.note,
        ...(importUsername ? getEmailOrUsername(item.username) : { email: item.username }),
        password: item.password,
        urls: [item.url],
        totp: item.otpSecret,
        extraFields: [item.username2, item.username3].filter(Boolean).map((username, index) => ({
            fieldName: `username${index + 1}`,
            type: 'text',
            data: { content: username ?? '' },
        })),
    });

export const processNoteItem = (item: DashlaneNoteItem): ItemImportIntent<'note'> =>
    importNoteItem({
        name: item.title,
        note: item.note,
    });

export const processCreditCardItem = (item: DashlanePaymentItem): ItemImportIntent<'creditCard'> =>
    importCreditCardItem({
        name: item.name,
        note: item.note,
        cardholderName: item.account_name,
        number: item.cc_number,
        verificationNumber: item.code,
        expirationDate:
            item.expiration_month && item.expiration_year
                ? `${item.expiration_month.padStart(2, '0')}${item.expiration_year}`
                : '',
    });

export const processIdentityItem = (item: DashlanePersonalInfoItem | DashlaneIdItem): ItemImportIntent<'identity'> =>
    importIdentityItem(buildDashlaneIdentity(item));

const parseDashlaneCSV = async <T extends DashlaneItem>(options: {
    data: Maybe<string>;
    headers: (keyof T)[];
    warnings?: string[];
}): Promise<T[]> => {
    return options.data
        ? (
              await readCSV<T>({
                  data: options.data,
                  headers: options.headers,
                  throwOnEmpty: false,
                  onError: (error) => options.warnings?.push(error),
              })
          ).items
        : [];
};

export const readDashlaneDataZIP = async ({
    data,
    importUsername,
}: {
    data: ArrayBuffer;
    importUsername?: boolean;
}): Promise<ImportPayload> => {
    const ignored: string[] = [];
    const warnings: string[] = [];

    try {
        const zipFile = await jszip.loadAsync(data);
        /* logins */
        const loginItems = (
            await parseDashlaneCSV<DashlaneLoginItem>({
                data: await zipFile.file('credentials.csv')?.async('string'),
                headers: DASHLANE_LOGINS_EXPECTED_HEADERS,
                warnings,
            })
        ).map((item) => processLoginItem(item, importUsername));

        /* notes */
        const noteItems = (
            await parseDashlaneCSV<DashlaneNoteItem>({
                data: await zipFile.file('securenotes.csv')?.async('string'),
                headers: DASHLANE_NOTES_EXPECTED_HEADERS,
                warnings,
            })
        ).map(processNoteItem);

        /* credit cards */
        const creditCards = (
            await parseDashlaneCSV<DashlanePaymentItem>({
                data: await zipFile.file('payments.csv')?.async('string'),
                headers: DASHLANE_CREDIT_CARDS_EXPECTED_HEADERS,
                warnings,
            })
        ).map(processCreditCardItem);

        const ids = groupItems(
            (
                await parseDashlaneCSV<DashlaneIdItem>({
                    data: await zipFile.file('ids.csv')?.async('string'),
                    headers: DASHLANE_IDS_EXPECTED_HEADERS,
                })
            ).map(processIdentityItem),
            FileKey.Ids
        );

        const personalInfos = (
            await parseDashlaneCSV<DashlanePersonalInfoItem>({
                data: await zipFile.file('personalInfo.csv')?.async('string'),
                headers: DASHLANE_PERSONAL_INFO_EXPECTED_HEADERS,
            })
        ).map(processIdentityItem);

        const vaults: ImportVault[] = [
            {
                name: getImportedVaultName(),
                shareId: null,
                items: [...loginItems, ...noteItems, ...creditCards, ...ids, ...personalInfos],
            },
        ];

        return { vaults, ignored, warnings };
    } catch (e) {
        logger.warn('[Importer::Dashlane]', e);
        throw new ImportProviderError('Dashlane', e);
    }
};

import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe, MaybeNull } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { prop, truthy } from '@proton/pass/utils/fp';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { isValidURL } from '@proton/pass/utils/url';

export const getImportedVaultName = (vaultName?: string) => {
    if (!vaultName) {
        const date = getFormattedDayFromTimestamp(getEpoch());
        // translator: Import - 16/05/2014
        return c('Title').t`Import - ${date}`;
    }
    return vaultName;
};

export const importLoginItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    username?: MaybeNull<string>;
    password?: MaybeNull<string>;
    urls?: Maybe<string>[];
    totp?: MaybeNull<string>;
    extraFields?: ItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
    appIds?: string[];
}): ItemImportIntent<'login'> => {
    const urls = [...new Set((options.urls ?? []).filter(truthy))]
        .map((uri) => {
            const { valid, url } = isValidURL(uri);
            return valid ? new URL(url) : undefined;
        })
        .filter(truthy);

    const name = options.name || urls[0]?.hostname || c('Label').t`Unnamed item`;

    const getTOTPvalue = (totp?: MaybeNull<string>) => {
        return totp ? parseOTPValue(totp, { label: options.name || urls[0]?.hostname }) : '';
    };

    return {
        type: 'login',
        metadata: {
            name,
            note: options.note || '',
            itemUuid: uniqueId(),
        },
        content: {
            username: options.username || '',
            password: options.password || '',
            urls: urls.filter((url) => url.origin !== 'null').map(prop('href')),
            totpUri: getTOTPvalue(options.totp),
        },
        extraFields:
            options.extraFields?.map((field) => {
                if (field.type === 'totp') {
                    return {
                        ...field,
                        data: { totpUri: getTOTPvalue(field.data.totpUri) },
                    };
                }
                return field;
            }) ?? [],
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
        platformSpecific: options.appIds
            ? {
                  android: {
                      allowedApps: options.appIds.map((appId) => ({
                          packageName: appId,
                          appName: appId,
                          hashes: [appId],
                      })),
                  },
              }
            : undefined,
    };
};

export const importNoteItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
}): ItemImportIntent<'note'> => {
    return {
        type: 'note',
        metadata: {
            name: options.name || c('Label').t`Unnamed note`,
            note: options.note || '',
            itemUuid: uniqueId(),
        },
        content: {},
        extraFields: [],
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
    };
};

export const importCreditCardItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    cardholderName?: MaybeNull<string>;
    number?: MaybeNull<string>;
    verificationNumber?: MaybeNull<string>;
    expirationDate?: MaybeNull<string>;
    pin?: MaybeNull<string>;
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
}): ItemImportIntent<'creditCard'> => {
    return {
        type: 'creditCard',
        metadata: {
            name: options.name || c('Label').t`Unnamed Credit Card`,
            note: options.note || '',
            itemUuid: uniqueId(),
        },
        content: {
            cardType: CardType.Unspecified,
            cardholderName: options.cardholderName || '',
            number: options.number || '',
            verificationNumber: options.verificationNumber || '',
            expirationDate: options.expirationDate || '',
            pin: options.pin || '',
        },
        extraData: [],
        extraFields: [],
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
    };
};

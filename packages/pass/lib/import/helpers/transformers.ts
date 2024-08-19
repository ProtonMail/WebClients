import { c } from 'ttag';

import { obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import type { Item, ItemContent, ItemImportIntent, Maybe, MaybeNull, UnsafeItemExtraField } from '@proton/pass/types';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { epochToDate } from '@proton/pass/utils/time/format';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

export const getImportedVaultName = (vaultName?: string) => {
    if (!vaultName) {
        const date = epochToDate(getEpoch());
        // translator: Import - 16/05/2014
        return c('Title').t`Import - ${date}`;
    }
    return vaultName;
};

export const getEmailOrUsername = (userIdentifier?: MaybeNull<string>): { email: string; username: string } => {
    if (!userIdentifier) {
        return { email: '', username: '' };
    }
    const email = validateEmailAddress(userIdentifier) ? userIdentifier : '';
    const username = !validateEmailAddress(userIdentifier) ? userIdentifier : '';
    return { username, email };
};

export const importLoginItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    password?: MaybeNull<string>;
    urls?: Maybe<string>[];
    totp?: MaybeNull<string>;
    extraFields?: UnsafeItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
    appIds?: string[];
    email?: MaybeNull<string>;
    username?: MaybeNull<string>;
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
        ...(obfuscateItem({
            type: 'login',
            metadata: { name, note: options.note || '', itemUuid: uniqueId() },
            content: {
                itemEmail: options.email || '',
                itemUsername: options.username || '',
                password: options.password || '',
                urls: urls.filter((url) => url.origin !== 'null').map(prop('href')),
                totpUri: getTOTPvalue(options.totp),
                passkeys: [] /** FIXME: support importing passkeys in the future */,
            },
            extraFields:
                options.extraFields?.map((field) =>
                    field.type === 'totp' ? { ...field, data: { totpUri: getTOTPvalue(field.data.totpUri) } } : field
                ) ?? [],
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
        }) as Item<'login'>),
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
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
            note: obfuscate(options.note || ''),
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
}): ItemImportIntent<'creditCard'> => ({
    ...(obfuscateItem({
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
            expirationDate: options.expirationDate ?? '',
            pin: options.pin || '',
        },

        extraFields: [],
    }) as Item<'creditCard'>),
    extraData: [],
    trashed: options.trashed ?? false,
    createTime: options.createTime,
    modifyTime: options.modifyTime,
});

export const importIdentityItem = ({
    name,
    note,
    createTime,
    modifyTime,
    ...content
}: ItemContent<'identity'> & {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    createTime?: number;
    modifyTime?: number;
}): ItemImportIntent<'identity'> => ({
    type: 'identity',
    metadata: {
        name: name || c('Label').t`Unnamed identity`,
        note: obfuscate(note || ''),
        itemUuid: uniqueId(),
    },
    content,
    extraFields: [],
    extraData: [],
    trashed: false,
    createTime: createTime,
    modifyTime: modifyTime,
});

import { c } from 'ttag';

import PassUI from '@proton/pass/lib/core/ui.proxy';
import { obfuscateExtraFields, obfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import { parseOTPValue } from '@proton/pass/lib/otp/otp';
import type {
    CustomSectionValue,
    DeobfuscatedItemExtraField,
    Item,
    ItemContent,
    ItemImportIntent,
    Maybe,
    MaybeNull,
} from '@proton/pass/types';
import { CardType, WifiSecurity } from '@proton/pass/types/protobuf/item-v1.static';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { epochToDate } from '@proton/pass/utils/time/format';
import { sanitizeURL } from '@proton/pass/utils/url/sanitize';

export const getImportedVaultName = (vaultName?: string) => {
    if (!vaultName) {
        const date = epochToDate(getEpoch());
        // translator: Import - 16/05/2014
        return c('Title').t`Import - ${date}`;
    }
    return vaultName;
};

export const getEmailOrUsername = async (
    userIdentifier?: MaybeNull<string>
): Promise<{ email: string; username: string }> => {
    if (!userIdentifier) return { email: '', username: '' };

    try {
        return (await PassUI.is_email_valid(userIdentifier))
            ? { email: userIdentifier, username: '' }
            : { email: '', username: userIdentifier };
    } catch {
        return { email: userIdentifier, username: '' };
    }
};

export const importLoginItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    password?: MaybeNull<string>;
    urls?: Maybe<string>[];
    totp?: MaybeNull<string>;
    extraFields?: DeobfuscatedItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
    appIds?: string[];
    email?: MaybeNull<string>;
    username?: MaybeNull<string>;
}): ItemImportIntent<'login'> => {
    const urls = [...new Set((options.urls ?? []).filter(truthy))]
        .map((uri) => {
            const { valid, url } = sanitizeURL(uri);
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
    extraFields?: DeobfuscatedItemExtraField[];
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
        extraFields: obfuscateExtraFields(options.extraFields),
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
    extraFields?: DeobfuscatedItemExtraField[];
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

        extraFields: options.extraFields ?? [],
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
    extraFields?: DeobfuscatedItemExtraField[];
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

export const importCustomItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    extraFields?: DeobfuscatedItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
    sections?: CustomSectionValue[];
}): ItemImportIntent<'custom'> => {
    return {
        type: 'custom',
        metadata: {
            name: options.name || c('Label').t`Unnamed custom item`,
            note: obfuscate(options.note || ''),
            itemUuid: uniqueId(),
        },
        content: { sections: options.sections ?? [] },
        extraData: [],
        extraFields: obfuscateExtraFields(options.extraFields),
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
    };
};

export const importSshKeyItem = (options: {
    name?: MaybeNull<string>;
    privateKey?: MaybeNull<string>;
    publicKey?: MaybeNull<string>;
    note?: MaybeNull<string>;
    extraFields?: DeobfuscatedItemExtraField[];
    sections?: ItemImportIntent<'sshKey'>['content']['sections'];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
}): ItemImportIntent<'sshKey'> => {
    return {
        type: 'sshKey',
        metadata: {
            name: options.name || c('Label').t`Unnamed SSH key`,
            note: obfuscate(options.note || ''),
            itemUuid: uniqueId(),
        },
        content: {
            privateKey: obfuscate(options.privateKey ?? ''),
            publicKey: options.publicKey ?? '',
            sections: options.sections ?? [],
        },
        extraData: [],
        extraFields: obfuscateExtraFields(options.extraFields),
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
    };
};

export const importWifiItem = (options: {
    name?: MaybeNull<string>;
    ssid?: MaybeNull<string>;
    password?: MaybeNull<string>;
    security: MaybeNull<WifiSecurity>;
    note?: MaybeNull<string>;
    extraFields?: DeobfuscatedItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
}): ItemImportIntent<'wifi'> => {
    return {
        type: 'wifi',
        metadata: {
            name: options.name || c('Label').t`Unnamed WiFi item`,
            note: obfuscate(options.note || ''),
            itemUuid: uniqueId(),
        },
        content: {
            ssid: options.ssid ?? '',
            password: obfuscate(options.password ?? ''),
            security: options.security ?? WifiSecurity.UnspecifiedWifiSecurity,
            sections: [],
        },
        extraData: [],
        extraFields: obfuscateExtraFields(options.extraFields),
        trashed: options.trashed ?? false,
        createTime: options.createTime,
        modifyTime: options.modifyTime,
    };
};

import { c } from 'ttag';

import type {
    CustomSectionValue,
    DeobfuscatedItemExtraField,
    Item,
    ItemContent,
    ItemImportIntent,
    Maybe,
    MaybeNull,
} from '../../../types';
import { AutofillMode, CardType, WifiSecurity } from '../../../types/protobuf';
import type { AutofillUrl } from '../../../types/protobuf/item-v1';
import { truthy } from '../../../utils/fp/predicates';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { uniqueId } from '../../../utils/string/unique-id';
import { getEpoch } from '../../../utils/time/epoch';
import { epochToDate } from '../../../utils/time/format';
import PassUI from '../../core/ui.proxy';
import { obfuscateExtraFields, obfuscateItem } from '../../items/item.obfuscation';
import { parseOTPValue } from '../../otp/otp';
import { isAutofillModeDataOfTypeUrl, uniqueAutofillUrls } from '../../urls/utils/autofill';
import { parseUrl } from '../../urls/utils/parser';
import { sanitizeURL } from '../../urls/utils/sanitize';
import { safeRegExpFromPattern } from '../../urls/utils/utils';

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

/** Dedupes and sanitizes autofill entries: rejects entries with an unrecognized
 * `mode` (e.g. from corrupted or hand-edited import data), malformed urls,
 * unsupported schemes and oversized hostnames for URL-type modes, and
 * invalid/unsafe patterns for `RegularExpression` via the same `safe-regex2`
 * check the matching engine itself applies at match time. Every import provider
 * must route `AutofillUrl[]` through this before persisting it. */
export const sanitizeAutofillUrls = (urls: AutofillUrl[]): AutofillUrl[] =>
    uniqueAutofillUrls(urls).flatMap(({ url, mode }): AutofillUrl[] => {
        if (AutofillMode[mode] === undefined) return [];
        if (mode === AutofillMode.RegularExpression) {
            return safeRegExpFromPattern(url) !== null ? [{ url, mode }] : [];
        }
        if (!isAutofillModeDataOfTypeUrl(mode)) return [{ url, mode }];
        const { valid, url: sanitized } = sanitizeURL(url);
        return valid && sanitized ? [{ url: sanitized, mode }] : [];
    });

export const importLoginItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    password?: MaybeNull<string>;
    urls?: Maybe<string>[];
    autofillUrls?: AutofillUrl[];
    totp?: MaybeNull<string>;
    extraFields?: DeobfuscatedItemExtraField[];
    trashed?: boolean;
    createTime?: number;
    modifyTime?: number;
    appIds?: string[];
    email?: MaybeNull<string>;
    username?: MaybeNull<string>;
}): ItemImportIntent<'login'> => {
    const legacyUrls = (options.urls ?? []).filter(truthy).map((url) => ({ url, mode: AutofillMode.Default }));
    const autofillUrls = sanitizeAutofillUrls([...legacyUrls, ...(options.autofillUrls ?? [])]);

    const firstUrl = autofillUrls.find(({ mode }) => isAutofillModeDataOfTypeUrl(mode))?.url;
    const firstHostname = parseUrl(firstUrl).hostname;
    const name = options.name || firstHostname || c('Label').t`Unnamed item`;

    const getTOTPvalue = (totp?: MaybeNull<string>) => {
        return totp ? parseOTPValue(totp, { label: options.name || firstHostname }) : '';
    };

    return {
        ...(obfuscateItem({
            type: 'login',
            metadata: { name, note: options.note || '', itemUuid: uniqueId() },
            content: {
                itemEmail: options.email || '',
                itemUsername: options.username || '',
                password: options.password || '',
                autofillUrls,
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

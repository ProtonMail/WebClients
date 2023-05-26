import { c } from 'ttag';

import type { ItemExtraField, ItemImportIntent, Maybe, MaybeNull } from '@proton/pass/types';
import { prop, truthy } from '@proton/pass/utils/fp';
import { parseOTPValue } from '@proton/pass/utils/otp/otp';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';
import { getFormattedDayFromTimestamp } from '@proton/pass/utils/time/format';
import { isValidURL } from '@proton/pass/utils/url';

export const getImportedVaultName = (vaultName?: string) =>
    vaultName || c('Title').t`Import - ${getFormattedDayFromTimestamp(getEpoch())}`;

export const importLoginItem = (options: {
    name?: MaybeNull<string>;
    note?: MaybeNull<string>;
    username?: MaybeNull<string>;
    password?: MaybeNull<string>;
    urls?: Maybe<string>[];
    totps?: MaybeNull<Maybe<string>>[];
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

    const [totp, ...extraTotps] = (options.totps ?? [])
        .filter(truthy)
        .map((value) => parseOTPValue(value, { label: options.name || urls[0]?.hostname }));

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
            urls: urls.map(prop('origin')).filter((origin) => origin !== 'null'),
            totpUri: totp || '',
        },
        extraFields: extraTotps.map<ItemExtraField<'totp'>>((totpUri) => ({
            fieldName: 'totp',
            type: 'totp',
            data: { totpUri },
        })),
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

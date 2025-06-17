import { c } from 'ttag';

import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import type { DeobfuscatedItem, ItemCreateIntent, ItemCustomType, ItemEditIntent, ShareId } from '@proton/pass/types';
import { type CustomItemFormValues } from '@proton/pass/types';
import { WifiSecurity } from '@proton/pass/types/protobuf/item-v1';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { type CustomTemplate, customTemplateToFormFields } from './Custom.templates';

export const getNewCustomInitialValues = <T extends ItemCustomType>(
    type: ItemCustomType,
    shareId: ShareId
): CustomItemFormValues<T> => {
    const base = {
        name: '',
        note: '',
        shareId,
        sections: [],
        extraFields: [],
        files: filesFormInitializer(),
    };

    const values = ((): CustomItemFormValues<ItemCustomType> => {
        switch (type) {
            case 'custom':
                return { ...base, type };
            case 'sshKey':
                return { ...base, type, privateKey: '', publicKey: '' };
            case 'wifi':
                return { ...base, type, password: '', security: WifiSecurity.UnspecifiedWifiSecurity, ssid: '' };
        }
    })();

    return values as CustomItemFormValues<T>;
};

export const getEditCustomInitialValues = <T extends ItemCustomType>(
    item: DeobfuscatedItem<ItemCustomType>,
    shareId: ShareId
): CustomItemFormValues<T> => {
    const { metadata, content, extraFields } = item;

    const base = {
        name: metadata.name,
        note: metadata.note,
        shareId,
        sections: content.sections,
        extraFields,
        files: filesFormInitializer(),
    };

    const values = ((): CustomItemFormValues<ItemCustomType> => {
        switch (item.type) {
            case 'custom':
                return { ...base, type: 'custom' };

            case 'sshKey':
                const { privateKey, publicKey } = item.content;
                return { ...base, type: 'sshKey', privateKey, publicKey };

            case 'wifi':
                const { password, security, ssid } = item.content;
                return { ...base, type: 'wifi', password, security, ssid };
        }
    })();

    return values as CustomItemFormValues<T>;
};

export const getEditIntent = <T extends ItemCustomType>(
    values: CustomItemFormValues,
    item: DeobfuscatedItem<ItemCustomType>,
    itemId: string,
    lastRevision: number
): ItemEditIntent<T> => {
    const { shareId, name, note, sections, extraFields, files } = values;

    const base = {
        itemId,
        lastRevision,
        shareId,
        metadata: { ...item.metadata, name, note: obfuscate(note) },
        extraFields: obfuscateExtraFields(extraFields),
        files,
    };

    const update = ((): ItemEditIntent<ItemCustomType> => {
        switch (values.type) {
            case 'custom':
                return { ...base, type: 'custom', content: { sections } };

            case 'sshKey':
                const { privateKey, publicKey } = values;
                return { ...base, type: 'sshKey', content: { sections, privateKey: obfuscate(privateKey), publicKey } };

            case 'wifi':
                const { password, security, ssid } = values;
                return { ...base, type: 'wifi', content: { sections, password: obfuscate(password), security, ssid } };
        }
    })();

    return update as ItemEditIntent<T>;
};

export const getCreateIntent = <T extends ItemCustomType>(values: CustomItemFormValues): ItemCreateIntent<T> => {
    const optimisticId = uniqueId();
    const { shareId, name, note, sections, extraFields, files } = values;

    const base = {
        optimisticId,
        shareId,
        metadata: { name, note: obfuscate(note), itemUuid: optimisticId },
        extraFields: obfuscateExtraFields(extraFields),
        extraData: [],
        files,
    };

    const create = ((): ItemCreateIntent<ItemCustomType> => {
        switch (values.type) {
            case 'custom':
                return { ...base, type: 'custom', content: { sections } };

            case 'sshKey':
                const { privateKey, publicKey } = values;
                return { ...base, type: 'sshKey', content: { sections, privateKey: obfuscate(privateKey), publicKey } };

            case 'wifi':
                const { password, ssid, security } = values;
                return { ...base, type: 'wifi', content: { sections, password: obfuscate(password), ssid, security } };
        }
    })();

    return create as ItemCreateIntent<T>;
};

export const extraTypeFieldValues = (template: CustomTemplate, values: CustomItemFormValues): CustomItemFormValues => {
    const base = { ...values, extraFields: customTemplateToFormFields(template) };
    const { type } = template;

    switch (type) {
        case 'custom':
            return { ...base, type } satisfies CustomItemFormValues<'custom'>;

        case 'wifi':
            return {
                ...base,
                type,
                ssid: '',
                password: '',
                security: WifiSecurity.UnspecifiedWifiSecurity,
            } satisfies CustomItemFormValues<'wifi'>;

        case 'sshKey':
            return {
                ...base,
                type,
                publicKey: '',
                privateKey: '',
            } satisfies CustomItemFormValues<'sshKey'>;
    }
};

export const wifiSecurityLabel: Record<WifiSecurity, () => string> = {
    [WifiSecurity.UnspecifiedWifiSecurity]: () => c('Label').t`Unspecified`,
    [WifiSecurity.WPA]: () => 'WPA',
    [WifiSecurity.WPA2]: () => 'WPA2',
    [WifiSecurity.WPA3]: () => 'WPA3',
    [WifiSecurity.WEP]: () => 'WEP',
};

export const WifiSecurities = Object.values(WifiSecurity).filter((val) => typeof val === 'number') as WifiSecurity[];

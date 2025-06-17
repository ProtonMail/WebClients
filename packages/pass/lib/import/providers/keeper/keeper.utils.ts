import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { DeobfuscatedItemExtraField, ItemContent } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

import type { KeeperCustomFieldValue, KeeperCustomFields, KeeperItem, KeeperPhoneField } from './keeper.types';

const getCleanLabel = (label?: string) => {
    const clean = label?.replace(/^(\$text:|\$name:|\$secret:|\$)|:1$/g, '');
    return clean || c('Label').t`Text`;
};

/** Merge multiple Keeper phone number fields (number, region etc.) into a single extra field */
const importPhoneFields = (label: string, value: KeeperPhoneField): DeobfuscatedItemExtraField => {
    const { type, region, number, ext } = value;
    const fields = [type, region, number, ext].filter((part) => !isEmptyString(part));
    const content = fields.join(' ').trim();

    return {
        fieldName: getCleanLabel(label),
        type: 'text',
        data: { content },
    };
};

function isKeeperPhoneField(
    label: string,
    value: KeeperCustomFieldValue
): value is KeeperPhoneField | KeeperPhoneField[] {
    return label.startsWith('$phone:');
}

const keeperCustomFieldToExtraField = (
    customField: [string, KeeperCustomFieldValue]
): DeobfuscatedItemExtraField | DeobfuscatedItemExtraField[] => {
    const [label, value] = customField;
    const isHidden = label.startsWith('$secret:');
    const isPhone = isKeeperPhoneField(label, value);
    const isObject = typeof value === 'object';
    const isArray = Array.isArray(value);

    if (isArray) {
        return isPhone
            ? value.flatMap((value) => importPhoneFields(label, value))
            : value.flatMap((value) => keeperCustomFieldToExtraField([label, value]));
    } else if (isObject) {
        return isPhone
            ? importPhoneFields(label, value)
            : Object.entries(value).map(([nestedLabel, nestedValue]) => {
                  return {
                      fieldName: `${getCleanLabel(label)} - ${nestedLabel}`,
                      type: nestedLabel.startsWith('$secret:') ? 'hidden' : 'text',
                      data: { content: nestedValue ?? '' },
                  };
              });
    } else {
        return {
            fieldName: getCleanLabel(label),
            type: isHidden ? 'hidden' : 'text',
            data: { content: value ?? '' },
        };
    }
};

export const extractKeeperExtraFields = (customFields?: KeeperCustomFields, excludedLabels?: string[]) =>
    Object.entries(customFields ?? {})
        .filter(([label]) => !excludedLabels?.includes(label))
        .flatMap(keeperCustomFieldToExtraField) ?? [];

export const extractKeeperIdentity = (keeperItem: KeeperItem): ItemContent<'identity'> => {
    const item = itemBuilder('identity');
    const extraSectionFields = extractKeeperExtraFields(keeperItem.custom_fields, [
        '$name::1',
        '$text:company:1',
        '$email::1',
    ]);

    item.set('content', (content) => {
        content.set('firstName', keeperItem.custom_fields?.['$name::1']?.first ?? '');
        content.set('middleName', keeperItem.custom_fields?.['$name::1']?.middle ?? '');
        content.set('lastName', keeperItem.custom_fields?.['$name::1']?.last ?? '');
        content.set('company', keeperItem.custom_fields?.['$text:company:1'] ?? '');
        content.set('email', keeperItem.custom_fields?.['$email::1'] ?? '');

        if (extraSectionFields.length > 0) {
            content.set('extraSections', (sections) => {
                sections.push({
                    sectionName: c('Label').t`Extra fields`,
                    sectionFields: extraSectionFields,
                });
                return sections;
            });
        }

        return content;
    });

    return item.data.content;
};

const BUILTIN_EXTRA_FIELDS = [
    ['login', c('Label').t`Username`],
    ['password', c('Label').t`Password`],
    ['login_url', c('Label').t`Website`],
] as const;

export const getKeeperBuiltinExtraFields = (item: KeeperItem) =>
    BUILTIN_EXTRA_FIELDS.reduce<DeobfuscatedItemExtraField[]>((acc, [key, fieldName]) => {
        const content = item[key];
        if (content) acc.push({ fieldName, type: 'text', data: { content } });
        return acc;
    }, []);

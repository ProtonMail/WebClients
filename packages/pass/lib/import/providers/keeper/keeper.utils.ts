import { c } from 'ttag';

import { itemBuilder } from '@proton/pass/lib/items/item.builder';
import type { ItemContent, UnsafeItemExtraField } from '@proton/pass/types';

import type { KeeperCustomFieldValue, KeeperCustomFields, KeeperItem } from './keeper.types';

const keeperCustomFieldToExtraField = (
    customField: [string, KeeperCustomFieldValue]
): UnsafeItemExtraField | UnsafeItemExtraField[] => {
    const [label, value] = customField;
    const isHidden = label.startsWith('$secret:');
    const isObject = typeof value === 'object';
    const isArray = Array.isArray(value);

    if (isArray) {
        return value.flatMap((value) => keeperCustomFieldToExtraField([label, value]));
    } else if (isObject) {
        return Object.entries(value).map(([nestedLabel, nestedValue]) => {
            return {
                fieldName: `${label} - ${nestedLabel}`,
                type: nestedLabel.startsWith('$secret:') ? 'hidden' : 'text',
                data: { content: nestedValue ?? '' },
            };
        });
    } else {
        return {
            fieldName: label || (isHidden ? c('Label').t`Hidden` : c('Label').t`Text`),
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
                    sectionName: 'Extra fields',
                    sectionFields: extraSectionFields,
                });
                return sections;
            });
        }

        return content;
    });

    return item.data.content;
};

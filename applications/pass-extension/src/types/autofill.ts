import type { CCItemData, SelectedItem } from '@proton/pass/types';

/** NOTE: augment this type with additional ItemTypes
 * when supporting cross-frame support for all forms. */
export type AutofillRequest = {
    origin: string;
    type: 'creditCard';
    data: CCItemData;
};

export type AutofillItem = SelectedItem & { origin: string };

import type { CCFieldType } from '@proton/pass/fathom/labels';
import type { CCItemData, SelectedItem } from '@proton/pass/types';

export type WithAutofillOrigin<T> = T & { origin: string; frameId: number };
export type AutofillItem = WithAutofillOrigin<SelectedItem>;

/** NOTE: augment this type with additional `ItemTypes`
 * when supporting cross-frame support for all forms. */
export type AutofillRequest = {
    type: 'creditCard';
    data: CCItemData;
};

export type AutofillResult = {
    type: 'creditCard';
    /** Returns what fields where autofilled as part
     * of the autofill request for the specific frame.
     * We track autofilled fields to secure cross-frame
     * filling ensuring we never autofill more than twice.. */
    autofilled: CCFieldType[];
};

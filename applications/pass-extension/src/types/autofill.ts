import type { FrameField } from 'proton-pass-extension/types/frames';

import type { CCFieldType } from '@proton/pass/fathom/labels';
import type { CCItemData, SelectedItem } from '@proton/pass/types';

export type WithAutofillOrigin<T> = T &
    FrameField & {
        frameOrigin: string;
        origin: string;
    };

export type AutofillItem = WithAutofillOrigin<SelectedItem>;

export type AutofillSequence<T = {}> =
    | { status: 'start' }
    | ({ status: 'fill' } & T)
    | { status: 'completed'; refocus: FrameField };

export type AutofillStatus = AutofillSequence['status'];

/** NOTE: augment this type with additional `ItemTypes`
 * when supporting cross-frame support for all forms.
 * We use a "sequence" here for UX purposes. */
export type AutofillRequest<T extends AutofillStatus = AutofillStatus> = Extract<
    AutofillSequence<{
        type: 'creditCard';
        /** Credit card autofill request payload. The data field is partial to support
         * cross-origin autofill scenarios where sensitive fields (number, CVV) must be
         * stripped when autofilling across origin boundaries. */
        data: Partial<CCItemData>;
    }>,
    { status: T }
>;

export type AutofillResult = {
    type: 'creditCard';
    /** Returns what fields where autofilled as part
     * of the autofill request for the specific frame.
     * We track autofilled fields to secure cross-frame
     * filling ensuring we never autofill more than twice.. */
    autofilled: CCFieldType[];
};

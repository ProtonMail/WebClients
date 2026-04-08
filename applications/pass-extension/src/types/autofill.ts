import type { FrameField } from 'proton-pass-extension/types/frames';

import type { CCFieldType } from '@proton/pass/fathom/labels';
import type { FormCredentials } from '@proton/pass/types';
import type { ItemContent, SelectedItem } from '@proton/pass/types/data/items';
import type { CCItemData } from '@proton/pass/types/worker/data';

export type WithAutofillOrigin<T> = T &
    FrameField & {
        frameOrigin: string;
        origin: string;
    };

export type AutofillActionType = 'creditCard' | 'login' | 'identity' | 'email';
export type AutofillItem = WithAutofillOrigin<SelectedItem>;
export type AutofillValue = WithAutofillOrigin<{ value: string }>;

export type AbstractAutofillDTO<T extends Record<AutofillActionType, any>> = {
    [K in AutofillActionType]: { type: K } & T[K];
}[AutofillActionType];

export type AutofillActionDTO<T extends AutofillActionType = AutofillActionType> = Extract<
    AbstractAutofillDTO<{
        creditCard: AutofillItem;
        login: AutofillItem;
        identity: AutofillItem;
        email: AutofillValue;
    }>,
    { type: T }
>;

export type AutofillSequence<T = {}> =
    | { status: 'start' }
    | ({ status: 'fill' } & T)
    | { status: 'completed'; refocus: FrameField };

export type AutofillStatus = AutofillSequence['status'];

export type AutofillRequest<T extends AutofillStatus = AutofillStatus> = Extract<
    AutofillSequence<
        AbstractAutofillDTO<{
            login: SelectedItem & { credentials: FormCredentials; field: FrameField };
            identity: SelectedItem & { identity: ItemContent<'identity'>; field: FrameField };
            /** Credit card autofill request payload. The data field is partial to support
             * cross-origin autofill scenarios where sensitive fields (number, CVV) must be
             * stripped when autofilling across origin boundaries. */
            creditCard: SelectedItem & { data: Partial<CCItemData>; fields: FrameField[] };
            email: { data: string; field: FrameField };
        }>
    >,
    { status: T }
>;

export type AutofillResult = AbstractAutofillDTO<{
    /** Returns what fields where autofilled as part
     * of the autofill request for the specific frame.
     * We track autofilled fields to secure cross-frame
     * filling ensuring we never autofill more than twice.. */
    creditCard: { autofilled: CCFieldType[] };
    login: Record<never, never>;
    identity: Record<never, never>;
    email: Record<never, never>;
}>;

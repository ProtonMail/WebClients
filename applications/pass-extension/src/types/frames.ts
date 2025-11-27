import type { AbstractField } from 'proton-pass-extension/types/field';
import type { Coords } from 'proton-pass-extension/types/inline';

import type { FieldType, FormType } from '@proton/pass/fathom/labels';
import type { FrameId, MaybeNull, Result } from '@proton/pass/types';

export type FrameAttributes = {
    src?: string;
    name?: string;
    width?: number;
    height?: number;
    title?: string;
    ariaLabel?: string;
};

export type FrameQueryType = 'position' | 'form';

/** Query payload sent to parent frame to get child iframe position */
export type FrameQueryDTO = {
    /** ID of child frame whose position is being queried */
    frameId: number;
    /** Child frame attributes for identification in parent DOM */
    frameAttributes: FrameAttributes;
    /** "position": resolves relative positioning
     *  "form": resolves relative parent form */
    type: FrameQueryType;
};

/** Response from parent frame containing child iframe positioning data */
export type FrameQueryResponse<T extends FrameQueryType> = Extract<
    | {
          type: 'position';
          /** Child iframe coordinates relative to parent frame viewport */
          coords: Coords;
          /** Parent frame attributes for next iteration in coordinate chain */
          frameAttributes: FrameAttributes;
      }
    | { type: 'form'; formId: MaybeNull<string> },
    { type: T }
>;

export type FrameQueryResult = Result<FrameQueryResponse<FrameQueryType>>;
export type FrameCheckResult = { visible: boolean };

export type FrameField = {
    /** Random uuid fro cross-frame identification */
    fieldId: string;
    /** Parent form random uuid */
    formId: string;
    /** FrameID of the current field */
    frameId: number;
};

/** Relayed messages are most of the time forwarded to the service-worker
 * and re-dispatched to the relevant frameId. This allows having different
 * types if data needs to be transformed before relaying */
export type FrameRelay<T, Relayed = {}> = T & ({ type: 'initial' } | ({ type: 'relay' } & Relayed));

export type FrameFormMatch = { formId: string; formType: FormType; fields: FrameFieldMatch[] };
export type FrameFieldMatch<T extends FieldType = FieldType> = { fieldId: string } & AbstractField<T>;
export type FrameFormsResult = { formTypes: FormType[] };
export type FrameForms = { frameId: FrameId } & FrameFormsResult;

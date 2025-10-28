import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { Coords } from 'proton-pass-extension/types/inline';

import type { MaybeNull, Result } from '@proton/pass/types';

export type FrameAttributes = {
    src?: string;
    name?: string;
    width?: number;
    height?: number;
    title?: string;
    ariaLabel?: string;
};

/** Query payload sent to parent frame to get child iframe position */
export type FrameQueryDTO = {
    /** ID of child frame whose position is being queried */
    frameId: number;
    /** Child frame attributes for identification in parent DOM */
    frameAttributes: FrameAttributes;
    /** Parent frame ID (null for main frame) */
    parentFrameId: MaybeNull<number>;
};

/** Response from parent frame containing child iframe positioning data */
export type FrameQueryResponse = {
    /** Child iframe coordinates relative to parent frame viewport */
    coords: Coords;
    /** Parent frame attributes for next iteration in coordinate chain */
    frameAttributes: FrameAttributes;
};

export type FrameQueryResult = Result<FrameQueryResponse>;
export type FrameCheckResult = { visible: boolean };

export type FrameFieldFocusInEvent = FrameQueryResponse & { action: DropdownAction };
export type FrameFieldBlurEvent = FrameField;
export type FrameFieldBlurResult = { detach: boolean };

export type FrameField = {
    fieldId: string;
    formId: string;
    fieldFrameId?: number;
};

/** Relayed messages are most of the time forwarded to the service-worker
 * and re-dispatched to the relevant frameId. This allows having different
 * types if data needs to be transformed before relaying */
export type FrameRelay<T, Relayed = {}> = T & ({ type: 'initial' } | ({ type: 'relay' } & Relayed));

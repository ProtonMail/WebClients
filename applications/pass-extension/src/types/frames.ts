import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';

import type { Coords, MaybeNull, Result } from '@proton/pass/types';

export type FrameAttributes = {
    src?: string;
    name?: string;
    width?: number;
    height?: number;
};

export type FrameQueryDTO = {
    frameId: number;
    attributes: FrameAttributes;
    parentFrameId: MaybeNull<number>;
};

export type FrameQueryResponse = {
    /** coordinates of the child frame relative to its parent frame */
    coords: Coords;
    /** computed attributes of the parent frame */
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
 * types if data needs to be transformed before re-dispatching */
export type FrameRelay<T, Result = {}> = T & ({ type: 'request' } | ({ type: 'result' } & Result));

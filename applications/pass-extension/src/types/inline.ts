import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { InlineCloseOptions } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { FrameAttributes, FrameField, FrameRelay } from 'proton-pass-extension/types/frames';

import type { FrameId } from '@proton/pass/types';

export type Coords = { top: number; left: number };

export type DropdownStateDTO = {
    visible: boolean;
    focused: boolean;
    attachedField?: FrameField;
};

export type DropdownOpenDTO = {
    /** Type of autofill action (login, identity, credit card, etc.) */
    action: DropdownAction;
    /** Field coordinates relative to containing frame. Used with `frameAttributes`
     * during frame traversal to calculate absolute viewport positioning. */
    coords: Coords;
    /** Frame attributes for position identification during coordinate calculation */
    frameAttributes: FrameAttributes;
    /** Whether field was auto-focused vs user-initiated */
    autofocused: boolean;
    /** Wether field was previously autofilled */
    autofilled: boolean;
    /** Target input field identification data */
    field: FrameField;
    /** Origin URL of requesting frame */
    origin: string;
};

export type DropdownOpenedDTO = FrameRelay<Required<FrameField>, { passive: boolean }>;
export type DropdownCloseDTO = { field?: FrameField };
export type DropdownClosedDTO = FrameRelay<InlineCloseOptions & Required<FrameField>, { passive: boolean }>;

export type IconShiftResult = { dx: number };
export type IconShiftRequest = FrameRelay<
    Coords & { maxShift: number; radius: number; frameAttributes: FrameAttributes },
    { frameId: FrameId }
>;

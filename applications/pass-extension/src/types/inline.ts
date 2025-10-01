import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { FrameAttributes, FrameField, FrameRelay } from 'proton-pass-extension/types/frames';

import type { Coords } from '@proton/pass/types';

export type DropdownStateDTO = { visible: boolean; attachedField?: FrameField };

export type DropdownOpenDTO = FrameRelay<
    {
        /** Type of autofill action (login, identity, credit card, etc.) */
        action: DropdownAction;
        /** Field coordinates relative to containing frame. Used with `frameAttributes`
         * during frame traversal to calculate absolute viewport positioning. */
        coords: Coords;
        /** Frame attributes for position identification during coordinate calculation */
        frameAttributes: FrameAttributes;
        /** Whether field was auto-focused vs user-initiated */
        autofocused: boolean;
        /** Target input field identification data */
        field: FrameField;
        /** Origin URL of requesting frame */
        origin: string;
    },
    /** Result payload: calculated absolute positioning data */
    { fieldFrameId: number; frameId: number }
>;

export type DropdownOpenedDTO = Required<FrameField>;
export type DropdownCloseDTO = { field?: FrameField };
export type DropdownClosedDTO = { refocus: boolean } & Required<FrameField>;

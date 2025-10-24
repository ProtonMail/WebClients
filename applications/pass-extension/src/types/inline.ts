import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { FrameID } from 'proton-pass-extension/lib/utils/frames';
import type { FrameAttributes, FrameField, FrameRelay } from 'proton-pass-extension/types/frames';

export type Coords = { top: number; left: number };

export type DropdownStateDTO = {
    visible: boolean;
    focused: boolean;
    attachedField?: FrameField;
};

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
    {
        /** Field frame ID. Maybe deeply nested and not resolvable
         * from the top-frame */
        fieldFrameId: FrameID;
        /** Frame ID of the last visited frame when walking
         * up from `fieldFrameId` up to the top-frame */
        frameId: FrameID;
    }
>;

export type DropdownOpenedDTO = FrameRelay<Required<FrameField>, { passive: boolean }>;
export type DropdownCloseDTO = { field?: FrameField };
export type DropdownClosedDTO = FrameRelay<{ refocus: boolean } & Required<FrameField>, { passive: boolean }>;

export type IconShiftResult = { dx: number };
export type IconShiftRequest = FrameRelay<
    Coords & { maxWidth: number; radius: number; frameAttributes: FrameAttributes },
    { frameId: FrameID }
>;

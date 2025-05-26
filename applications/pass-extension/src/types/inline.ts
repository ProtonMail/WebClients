import type { DropdownAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { FrameAttributes, FrameField, FrameRelay } from 'proton-pass-extension/types/frames';

import type { Coords } from '@proton/pass/types';

export type DropdownOpenDTO = FrameRelay<
    {
        action: DropdownAction;
        /** coordinates of the field relative to the top-frame */
        coords: Coords;
        frameAttributes: FrameAttributes;
        autofocused?: boolean;
        field: FrameField;
        origin: string;
    },
    { fieldFrameId: number; frameId: number }
>;

export type DropdownCloseDTO = { field?: FrameField };
export type DropdownStateDTO = { visible: boolean; attachedField?: FrameField };
export type DropdownClosedDTO = { refocus: boolean; fieldFrameId: number } & FrameField;

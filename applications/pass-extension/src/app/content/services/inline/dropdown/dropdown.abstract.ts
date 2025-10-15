import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineMessage } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { DropdownStateDTO } from 'proton-pass-extension/types/inline';

import type { ListenerStore } from '@proton/pass/utils/listener/factory';

import type { DropdownRequest } from './dropdown.app';

export type InlineFieldTarget = { type: 'field'; field: FieldHandle };

export type InlineFrameTarget<Extra extends {} = {}> = {
    type: 'frame';
    fieldId: string;
    formId: string;
    /** FrameID in which the field is located */
    fieldFrameId: number;
    /** FrameID in the top frame in which the field is
     * located in. If the field is nested inside multiple
     * frames, then `frameId !== fieldFrameId` */
    frameId: number;
    frame: HTMLIFrameElement;
} & Extra;

export interface DropdownHandler {
    listeners: ListenerStore;
    attach: (layer?: HTMLElement) => void;
    close: (target?: InlineFieldTarget | Pick<InlineFrameTarget, 'type' | 'formId' | 'fieldId'>) => void;
    destroy: () => void;
    open: (request: DropdownRequest) => void;
    sendMessage: (message: InlineMessage) => void;
    getState: () => Promise<DropdownStateDTO>;
    settled: () => Promise<boolean>;
}

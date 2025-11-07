import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { InlineMessage } from 'proton-pass-extension/app/content/services/inline/inline.messages';
import type { FrameField } from 'proton-pass-extension/types/frames';
import type { DropdownStateDTO } from 'proton-pass-extension/types/inline';

import type { ListenerStore } from '@proton/pass/utils/listener/factory';

import type { DropdownRequest } from './dropdown.app';

export type InlineFieldTarget = { type: 'field'; field: FieldHandle };
export type InlineFrameTarget<E = {}> = { type: 'frame' } & FrameField & E;
export interface DropdownHandler {
    listeners: ListenerStore;
    attach: (layer?: HTMLElement) => void;
    close: (target?: InlineFieldTarget | InlineFrameTarget) => void;
    destroy: () => void;
    toggle: (request: DropdownRequest) => void;
    sendMessage: (message: InlineMessage) => void;
    getState: () => Promise<DropdownStateDTO>;
}

import type { ListenerStore } from '@proton/pass/utils/listener/factory';

import type { FrameField } from '../../../../../types/frames';
import type { DropdownStateDTO } from '../../../../../types/inline';
import type { FieldHandle } from '../../form/field';
import type { InlineMessage } from '../inline.messages';
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
    getState: (checkInFlight?: boolean) => Promise<DropdownStateDTO>;
}

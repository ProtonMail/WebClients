import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { IconRegistry } from 'proton-pass-extension/app/content/services/inline/icon/icon.registry';

import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';

import type { DropdownHandler } from './dropdown/dropdown.abstract';
import type { NotificationHandler } from './notification/notification.abstract';

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

export interface AbstractInlineService {
    init: () => void;
    sync: () => void;
    destroy: () => void;
    setTheme: (theme?: PassThemeOption) => void;

    dropdown: DropdownHandler;
    notification: NotificationHandler;
    icon: IconRegistry;
}

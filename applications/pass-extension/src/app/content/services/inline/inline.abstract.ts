import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { DropdownHandler } from 'proton-pass-extension/app/content/services/inline/handlers/dropdown.abstract';
import type { NotificationHandler } from 'proton-pass-extension/app/content/services/inline/handlers/notification.abstract';

import type { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';

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
}

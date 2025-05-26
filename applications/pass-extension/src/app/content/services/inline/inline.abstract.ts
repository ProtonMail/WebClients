import type { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { DropdownRequest } from 'proton-pass-extension/app/content/services/iframes/dropdown';
import type { IFrameMessage } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { NotificationRequest } from 'proton-pass-extension/app/content/services/iframes/notification';
import type { DropdownStateDTO } from 'proton-pass-extension/types/inline';

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

    dropdown: {
        attach: (layer?: HTMLElement) => void;
        close: (target?: InlineFieldTarget | Pick<InlineFrameTarget, 'type' | 'formId' | 'fieldId'>) => void;
        destroy: () => void;
        open: (request: DropdownRequest) => void;
        sendMessage: (message: IFrameMessage) => void;
        getState: () => Promise<DropdownStateDTO>;
    };

    notification: {
        attach: () => void;
        close: (action?: NotificationAction) => void;
        destroy: () => void;
        open: (request: NotificationRequest) => void;
    };
}

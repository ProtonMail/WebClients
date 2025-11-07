import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/services/client/client.channel';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { DropdownHandler } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.abstract';
import { computeIconShift } from 'proton-pass-extension/app/content/services/inline/icon/icon.utils';
import { getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { MaybeNull } from '@proton/pass/types';
import { createStyleParser, pixelParser } from '@proton/pass/utils/dom/computed-styles';
import { getNthParent } from '@proton/pass/utils/dom/tree';

import { type IconController, createIconController } from './icon.controller';

export type IconRef = { current: MaybeNull<IconController> };

export interface IconRegistry {
    attach: (field: FieldHandle) => void;
    destroy: () => void;
}

export type IconRegistryOptions = {
    channel: FrameMessageBroker;
    dropdown: DropdownHandler;
    mainFrame: boolean;
    tag: string;
};

/** Icon registry ensures only one icon can be injected at a time.
 * We keep a reference on the field itself */
export const createIconRegistry = ({ channel, dropdown, mainFrame, tag }: IconRegistryOptions): IconRegistry => {
    const icon: IconRef = { current: null };

    /** Handles icon position shift when elements overlay in the parent frame that the sub-frame
     * can't catch (eg: payment fields that need icon repositioning due to overlapping elements) */
    const onIconShift: FrameMessageHandler<WorkerMessageType.INLINE_ICON_SHIFT> = ({ payload }, sendResponse) => {
        if (payload.type === 'relay') {
            const target = getFrameElement(payload.frameId, payload.frameAttributes);

            if (target) {
                requestAnimationFrame(() => {
                    const rect = target.getBoundingClientRect();
                    const anchor = getNthParent(target, 2);
                    const parser = createStyleParser(target);
                    const pl = parser('padding-left', pixelParser);
                    const pt = parser('padding-top', pixelParser);
                    const x = payload.left + rect.left + pl;
                    const y = payload.top + rect.top + pt;
                    const { maxWidth, radius } = payload;
                    const dx = computeIconShift({ x, y, maxWidth, radius, target, anchor });
                    sendResponse({ dx });
                });

                return true;
            }
        }
    };

    channel.register(WorkerMessageType.INLINE_ICON_SHIFT, onIconShift);

    const registry: IconRegistry = {
        attach: (field) => {
            if (icon.current !== field.icon) icon.current?.detach();

            if (!field.icon) {
                const onClick = () => {
                    if (field.action) {
                        field.focus({ preventAction: true });
                        dropdown.toggle({
                            type: 'field',
                            action: field.action.type,
                            autofocused: false,
                            autofilled: field.autofilled !== null,
                            field,
                        });
                    }
                };

                const onDetach = () => (icon.current = null);

                icon.current = createIconController({ field, mainFrame, tag, onClick, onDetach });
                if (icon.current) field.setIcon(icon.current);
            }
        },

        destroy: () => {
            channel.unregister(WorkerMessageType.INLINE_ICON_SHIFT, onIconShift);
            icon.current?.detach();
            icon.current = null;
        },
    };

    return registry;
};

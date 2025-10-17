import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import type { DropdownHandler } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.abstract';

import type { MaybeNull } from '@proton/pass/types';

import { type IconController, createIconController } from './icon.controller';

export type IconRef = { current: MaybeNull<IconController> };

export interface IconRegistry {
    attach: (field: FieldHandle) => void;
    destroy: () => void;
}

/** Icon registry ensures only one icon can be injected at a time.
 * We keep a reference on the field itself
 */
export const createIconRegistry = (dropdown: DropdownHandler, tag: string): IconRegistry => {
    const icon: IconRef = { current: null };

    const registry: IconRegistry = {
        attach: (field) => {
            if (icon.current !== field.icon) icon.current?.detach();

            if (!field.icon) {
                const onClick = () => {
                    if (field.action) {
                        dropdown.open({
                            type: 'field',
                            action: field.action.type,
                            autofocused: false,
                            field,
                        });
                    }
                };

                icon.current = createIconController({ field, tag, onClick, onDetach: () => (icon.current = null) });
                if (icon.current) field.setIcon(icon.current);
            }
        },

        destroy: () => {
            if (icon.current) icon.current.detach();
            icon.current = null;
        },
    };

    return registry;
};

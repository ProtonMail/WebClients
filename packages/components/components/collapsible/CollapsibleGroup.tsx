import type { ComponentProps, ReactElement } from 'react';
import React, { Children, cloneElement, isValidElement, useState } from 'react';

import type Collapsible from './Collapsible';

type CollapsibleProps = ComponentProps<typeof Collapsible>;
type CollapsibleElement = ReactElement<CollapsibleProps, typeof Collapsible>;

type BaseProps = {
    /** The children of the group. Must be `Collapsible` components. */
    children: CollapsibleElement | CollapsibleElement[];
    /** Optional callback invoked when the open collapsible changes */
    onChange?: (id: string | null) => void;
};

type ControlledProps = BaseProps & {
    /** The currently opened collapsible ID. Presence indicates controlled mode. */
    value: string | null;
    /** Required for controlled mode to handle updates. */
    onChange: (id: string | null) => void;
    /** Not allowed in controlled mode. */
    defaultValue?: never;
};

type UncontrolledProps = BaseProps & {
    /** Initial open collapsible ID. Absence of `value` indicates uncontrolled mode. */
    defaultValue?: string | null;
    /** Optional callback for uncontrolled mode. */
    onChange?: (id: string | null) => void;
    /** Not allowed in uncontrolled mode. */
    value?: never;
};

export type Props = ControlledProps | UncontrolledProps;

/**
 * `CollapsibleGroup` manages a set of `Collapsible` components,
 * ensuring that only one collapsible is open at a time.
 *
 * **Controlled vs Uncontrolled**
 *
 * - **Controlled**: pass `value` + `onChange`. The parent fully controls which collapsible is open.
 * - **Uncontrolled**: pass `defaultValue` (optional). The component manages open state internally.
 *
 * **Forbidden properties**
 *
 * - Controlled: `value`, `onChange` (required), `defaultValue` forbidden
 * - Uncontrolled: `defaultValue`, optional `onChange`, `value` forbidden
 *
 * For full examples, see the [Collapsible stories](../../../../applications/storybook/src/stories/components/Collapsible.stories)
 */
export function CollapsibleGroup(props: Props) {
    const [internal, setInternal] = useState<string | null>('value' in props ? null : (props.defaultValue ?? null));

    const isControlled = 'value' in props;
    const openId = isControlled ? props.value : internal;

    const setOpen = (id: string | null) => {
        if (!isControlled) {
            setInternal(id);
        }
        props.onChange?.(id);
    };

    return (
        <>
            {Children.map(props.children, (child) => {
                if (!isValidElement<CollapsibleProps>(child)) {
                    return child;
                }

                const id = child.key?.toString();
                const isOpen = openId === id;

                return cloneElement(child, {
                    externallyControlled: true,
                    expandByDefault: isOpen,
                    onToggle: (next: boolean) => {
                        child.props.onToggle?.(next);
                        setOpen(next ? (id ?? null) : null);
                    },
                });
            })}
        </>
    );
}

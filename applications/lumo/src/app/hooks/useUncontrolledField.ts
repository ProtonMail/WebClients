import type { ChangeEvent, RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export interface UncontrolledFieldBind<T extends FieldElement> {
    ref: RefObject<T>;
    defaultValue: string;
    onChange: (event: ChangeEvent<T>) => void;
}

export interface UncontrolledField<T extends FieldElement> {
    /** Mirror of the current value, for derived UI only (disabled buttons, side effects). Never bind this back to the field's `value`. */
    value: string;
    /** Authoritative current value read straight from the DOM node. Use this when reading the final value (e.g. on submit). */
    getValue: () => string;
    /** Imperatively set the value (DOM node + mirror). Needed to clear a field that stays mounted between uses. */
    reset: (next?: string) => void;
    /** Props to spread onto an uncontrolled `<input>`/`<textarea>` (also works with `InputFieldTwo`/`TextAreaTwo`). */
    bind: UncontrolledFieldBind<T>;
}

/**
 * Keeps a text field uncontrolled (the DOM node owns its value) while still
 * exposing the value to React for derived UI.
 *
 * Some Android WebViews — notably Samsung's — reset the caret to position 0 when
 * React reasserts the `value` prop of a controlled `<input>`/`<textarea>` in the
 * middle of an IME composition. Each new character is then inserted at the start,
 * so text appears to be typed backwards. Driving the field with `defaultValue`
 * instead of `value` avoids this, since re-renders no longer touch the DOM value.
 */
export function useUncontrolledField<T extends FieldElement = HTMLInputElement>(
    initialValue = ''
): UncontrolledField<T> {
    const ref = useRef<T>(null);
    const [value, setValue] = useState(initialValue);

    const onChange = useCallback((event: ChangeEvent<T>) => {
        setValue(event.target.value);
    }, []);

    const getValue = useCallback(() => ref.current?.value ?? value, [value]);

    const reset = useCallback((next = '') => {
        setValue(next);
        if (ref.current) {
            ref.current.value = next;
        }
    }, []);

    return {
        value,
        getValue,
        reset,
        bind: { ref, defaultValue: initialValue, onChange },
    };
}

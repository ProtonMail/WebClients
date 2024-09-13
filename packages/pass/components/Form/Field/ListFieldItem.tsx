/* eslint-disable jsx-a11y/no-static-element-interactions */
import type { KeyboardEventHandler } from 'react';
import { useRef, useState } from 'react';

import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import type { ListFieldValue } from './ListField';

export type ListFieldItemProps<T> = ListFieldValue<T> & {
    error?: boolean;
    loading: boolean;
    onChange: (value: string) => void;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    renderValue: (value: T) => string;
};

const getCaretPosition = (el: HTMLElement): number => {
    const selection = getSelection();

    if (selection) {
        const range = selection.getRangeAt(0);
        const clonedRange = range.cloneRange();
        clonedRange.selectNodeContents(el);
        clonedRange.setEnd(range.endContainer, range.endOffset);

        return clonedRange.toString().length;
    }

    return 0;
};

export const ListFieldItem = <T,>({
    id,
    error,
    loading,
    value,
    onChange,
    onMoveLeft,
    onMoveRight,
    renderValue,
}: ListFieldItemProps<T>) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [editing, setEditing] = useState(false);

    const handleBlur = () => {
        setEditing(false);
        const update = ref.current?.innerText?.trim() ?? '';
        if (update !== value) onChange(update);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLSpanElement> = (evt) => {
        if (!ref.current) return;

        const el = ref.current;
        const { innerText = '' } = el;

        switch (evt.key) {
            case 'Enter':
                evt.preventDefault();
                onMoveRight();
                break;

            case 'ArrowLeft':
            case 'Backspace':
                /** trigger move left if we've reached the start
                 * of the contenteditable's inner text */
                if (getCaretPosition(el) === 0) {
                    evt.preventDefault();
                    onMoveLeft();
                }
                break;

            case 'ArrowRight':
                /** trigger move right if we've reached the end
                 * of the contenteditable's inner text */
                if (getCaretPosition(el) >= (innerText.length ?? 0)) {
                    evt.preventDefault();
                    onMoveRight();
                }
                break;
        }
    };

    return (
        <li
            className={clsx(
                'pass-field-text-group--item flex flex-nowrap flex-row max-w-full overflow-hidden stop-propagation border rounded',
                error && 'pass-field-text-group--item:error',
                loading && 'pass-field-text-group--item:loading'
            )}
        >
            <button
                className="pill-remove inline-flex flex-nowrap items-center px-2 py-1 max-w-full gap-2"
                type="button"
                tabIndex={-1}
            >
                <span
                    id={id}
                    onBlur={handleBlur}
                    onFocus={() => setEditing(true)}
                    onClick={(e) => e.stopPropagation()}
                    contentEditable
                    onKeyDown={handleKeyDown}
                    ref={ref}
                    spellCheck={false}
                    className={clsx(!editing && 'text-ellipsis')}
                    suppressContentEditableWarning
                >
                    {renderValue(value)}
                </span>
                {loading && <CircleLoader size="small" className="shrink-0" />}
            </button>
        </li>
    );
};

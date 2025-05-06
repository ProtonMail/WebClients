/* eslint-disable jsx-a11y/no-static-element-interactions */
import type { KeyboardEventHandler } from 'react';
import { memo, useRef, useState } from 'react';

import { ButtonLike, CircleLoader } from '@proton/atoms';
import { Icon } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

import type { ListFieldValue } from './ListField';

export type ListFieldItemProps<T> = {
    index: number;
    entry: ListFieldValue<T>;
    error?: boolean;
    loading: boolean;
    onChange: (value: string, idx: number, entry: ListFieldValue<T>) => void;
    onDelete: (idx: number) => void;
    onMoveLeft: (idx: number) => void;
    onMoveRight: (idx: number) => void;
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

const ListFieldItemRender = <T,>({
    index,
    entry,
    error,
    loading,
    onChange,
    onDelete,
    onMoveLeft,
    onMoveRight,
    renderValue,
}: ListFieldItemProps<T>) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [editing, setEditing] = useState(false);

    const handleBlur = () => {
        setEditing(false);
        const update = ref.current?.innerText?.trim() ?? '';
        if (update !== entry.value) onChange(update, index, entry);
    };

    const handleKeyDown: KeyboardEventHandler<HTMLSpanElement> = (evt) => {
        if (!ref.current) return;

        const el = ref.current;
        const { innerText = '' } = el;

        switch (evt.key) {
            case 'Enter':
                evt.preventDefault();
                onMoveRight(index);
                break;

            case 'ArrowLeft':
            case 'Backspace':
                /** trigger move left if we've reached the start
                 * of the contenteditable's inner text */
                if (getCaretPosition(el) === 0) {
                    evt.preventDefault();
                    onMoveLeft(index);
                }
                break;

            case 'ArrowRight':
                /** trigger move right if we've reached the end
                 * of the contenteditable's inner text */
                if (getCaretPosition(el) >= (innerText.length ?? 0)) {
                    evt.preventDefault();
                    onMoveRight(index);
                }
                break;
        }
    };

    return (
        <li
            className={clsx(
                'pass-field-text-group--item flex flex-nowrap flex-row max-w-full overflow-hidden stop-propagation border rounded',
                error && 'pass-field-text-group--item:error',
                loading && 'pass-field-text-group--item:loading',
                editing && 'pass-field-text-group--item:editing'
            )}
        >
            <button
                className="pill-remove inline-flex flex-nowrap items-center px-2 py-1 max-w-full gap-2 relative"
                type="button"
                tabIndex={-1}
            >
                <span
                    id={entry.id}
                    onBlur={handleBlur}
                    onFocus={() => setEditing(true)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    contentEditable
                    onKeyDown={handleKeyDown}
                    ref={ref}
                    spellCheck={false}
                    className={clsx(!editing && 'text-ellipsis')}
                    suppressContentEditableWarning
                >
                    {renderValue(entry.value)}
                </span>

                {loading && <CircleLoader size="small" className="shrink-0" />}

                {!loading && (
                    <ButtonLike
                        as="a"
                        className="pass-field-text-group--item-delete flex absolute"
                        shape="ghost"
                        pill
                        icon
                        onClick={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            onDelete(index);
                        }}
                    >
                        <Icon name="cross" className="shrink-0" />
                    </ButtonLike>
                )}
            </button>
        </li>
    );
};

export const ListFieldItem = memo(ListFieldItemRender) as typeof ListFieldItemRender;

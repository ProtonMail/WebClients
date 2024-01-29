/* eslint-disable jsx-a11y/no-static-element-interactions */
import type { KeyboardEventHandler } from 'react';
import { type FC, useCallback, useRef } from 'react';

import type { FieldProps, FormikErrors } from 'formik';
import { FieldArray } from 'formik';

import type { IconName } from '@proton/components/';
import { Icon, InputFieldTwo } from '@proton/components/';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import clsx from '@proton/utils/clsx';

import { FieldBox } from './Layout/FieldBox';

import './TextGroupField.scss';

type ExtractArrayFields<V, K extends keyof V = keyof V> = K extends string
    ? V[K] extends ArrayFieldEntry[]
        ? K
        : never
    : never;

export type ArrayFieldEntry = { id: string; value: string };

const createNewEntry = (value: string): ArrayFieldEntry => ({ id: uniqueId(), value });

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

type TextGroupFieldItemProps = ArrayFieldEntry & {
    error?: boolean;
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onValue: (value: string) => void;
};

const TextGroupFieldItem: FC<TextGroupFieldItemProps> = ({ id, error, value, onMoveLeft, onMoveRight, onValue }) => {
    const ref = useRef<HTMLSpanElement>(null);

    const handleBlur = () => {
        const next = ref.current?.innerText ?? '';
        if (next !== value) onValue(ref.current?.innerText ?? '');
    };

    const handleKeyDown: KeyboardEventHandler = (evt) => {
        if (!ref.current) return;

        const el = ref.current;
        const { innerText = '' } = el;

        if (evt.key === 'Enter') {
            evt.preventDefault();
            el.blur();
        }

        if (evt.key === 'ArrowLeft' && getCaretPosition(el) === 0) {
            evt.preventDefault();
            onMoveLeft();
        }

        if (evt.key === 'ArrowRight' && getCaretPosition(el) >= (innerText.length ?? 0)) {
            evt.preventDefault();
            onMoveRight();
        }
    };

    return (
        <li
            className={clsx(
                'pass-field-text-group--item flex flex-nowrap flex-row max-w-full overflow-hidden stop-propagation border rounded',
                error && 'pass-field-text-group--item:error'
            )}
        >
            <button className="pill-remove inline-flex shrink-0 px-2 py-1 max-w-full" type="button" tabIndex={-1}>
                <span
                    id={id}
                    onBlur={handleBlur}
                    onClick={(e) => e.stopPropagation()}
                    contentEditable
                    onKeyDown={handleKeyDown}
                    ref={ref}
                    spellCheck={false}
                    className="text-ellipsis"
                    suppressContentEditableWarning
                >
                    {value}
                </span>
            </button>
        </li>
    );
};

type TextGroupFieldProps<V> = FieldProps & {
    fieldKey: ExtractArrayFields<V>;
    icon?: IconName;
    label?: string;
    placeholder?: string;
    renderError?: (errors: FormikErrors<ArrayFieldEntry[]>) => string;
};

/** `TextGroupField` is generic over form values : valid `fieldKey` must
 * be of type `ArrayFieldEntry[]` for proper type-safety */
export const TextGroupField = <V,>({
    fieldKey,
    form,
    icon,
    label,
    placeholder,
    renderError,
}: TextGroupFieldProps<V>) => {
    const inputRef = useRef<HTMLInputElement>(null);

    /* Move the trailing input outside of react life-cycle  */
    const getValue = useCallback(() => inputRef.current!.value, []);
    const setValue = useCallback((value: string) => (inputRef.current!.value = value), []);

    const values = (form.values[fieldKey] ?? []) as ArrayFieldEntry[];
    const errors = form.errors[fieldKey] as FormikErrors<ArrayFieldEntry>[];

    const hasEntry = Boolean(values) || values.some(({ value }) => !isEmptyString(value));

    return (
        <FieldBox icon={icon} className={clsx(errors && 'field-two--invalid')}>
            {label && (
                <label
                    htmlFor="next-url-field"
                    className="field-two-label text-sm"
                    style={{ color: hasEntry ? 'var(--text-weak)' : 'inherit' }}
                >
                    {label}
                </label>
            )}

            <FieldArray
                name={fieldKey}
                render={(helpers) => {
                    const selectAtIndex = (idx: number) => document.getElementById(values[idx].id)?.focus();

                    const handleAdd = () => {
                        const value = getValue().trim();
                        if (value) helpers.push(createNewEntry(value));
                        setValue('');
                    };

                    const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
                        if (evt.key === 'Enter') {
                            evt.preventDefault();
                            handleAdd();
                        }

                        if (evt.key === 'Backspace' && getValue().length === 0) {
                            setValue('');
                            helpers.pop();
                        }

                        if (evt.key === 'ArrowLeft' && inputRef.current?.selectionStart === 0 && values.length > 0) {
                            selectAtIndex(values.length - 1);
                        }

                        if (evt.key === ' ') evt.stopPropagation();
                    };

                    return (
                        <div className="w-full flex-1 relative">
                            <div className="flex *:min-size-auto flex-1'">
                                <div className="flex-1 flex gap-1.5 max-w-full max-h-full relative">
                                    {values.map((entry, idx) => (
                                        <TextGroupFieldItem
                                            key={entry.id}
                                            {...entry}
                                            error={Boolean(errors?.[idx]?.value)}
                                            onValue={(value) => {
                                                inputRef.current?.focus();
                                                return value.trim()
                                                    ? helpers.replace(idx, { ...entry, value })
                                                    : helpers.remove(idx);
                                            }}
                                            onMoveLeft={() => idx > 0 && selectAtIndex(idx - 1)}
                                            onMoveRight={() => {
                                                if (idx < values.length - 1) selectAtIndex(idx + 1);
                                                else inputRef.current?.focus();
                                            }}
                                        />
                                    ))}
                                    <div className="flex max-w-full max-h-full relative grow-2">
                                        <div className="flex-1 flex items-center">
                                            <InputFieldTwo
                                                unstyled
                                                assistContainerClassName="empty:hidden"
                                                inputClassName="color-norm px-2 py-1 rounded-none"
                                                placeholder={values.length === 0 ? placeholder : ''}
                                                onBlur={handleAdd}
                                                onKeyDown={onKeyDown}
                                                ref={inputRef}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            />
            {renderError && errors && (
                <div className="field-two-assist flex flex-nowrap items-start mt-4">
                    <Icon name="exclamation-circle-filled" className="shrink-0 mr-1" />
                    <span>{renderError(errors)}</span>
                </div>
            )}
        </FieldBox>
    );
};

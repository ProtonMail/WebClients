/* eslint-disable jsx-a11y/no-static-element-interactions */
import type { KeyboardEventHandler, ReactNode, Ref } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { FieldProps, FormikErrors } from 'formik';
import { FieldArray } from 'formik';

import type { Input } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components';
import type { IconName } from '@proton/components/';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import useCombinedRefs from '@proton/hooks/useCombinedRefs';
import type { Unpack } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import clsx from '@proton/utils/clsx';
import debounce from '@proton/utils/debounce';

import { FieldBox } from './Layout/FieldBox';
import { ListFieldItem } from './ListFieldItem';

import './ListField.scss';

export type ListFieldValue<T> = { id: string; value: T };
export type ListFieldType<V, K extends keyof V> = Unpack<V[K]> extends ListFieldValue<infer U> ? U : never;
export type ListFieldKeys<V> = { [K in keyof V]: V[K] extends ListFieldValue<any>[] ? K : never }[keyof V];

type ListFieldProps<Values, FieldKey extends ListFieldKeys<Values>, T = ListFieldType<Values, FieldKey>> = FieldProps &
    Omit<InputFieldProps<typeof Input>, 'onValue' | 'onBlur'> & {
        fieldKey: FieldKey;
        fieldRef?: Ref<HTMLInputElement>;
        icon?: IconName;
        label?: string;
        placeholder?: string;
        fieldValue: (entry: T) => string;
        onAutocomplete?: (value: string) => void;
        onBlur?: (value: string) => void;
        onPush: (value: string) => ListFieldValue<T>;
        onReplace: (value: string, entry: ListFieldValue<T>) => ListFieldValue<T>;
        renderError?: (errors: FormikErrors<ListFieldValue<T>[]>) => ReactNode;
        fieldLoading?: (entry: ListFieldValue<T>) => boolean;
    };

export const ListField = <
    Values,
    FieldKey extends ListFieldKeys<Values> = ListFieldKeys<Values>,
    T extends ListFieldType<Values, FieldKey> = ListFieldType<Values, FieldKey>,
>({
    autoFocus,
    fieldKey,
    fieldRef,
    form,
    icon,
    label,
    placeholder,
    fieldValue,
    onAutocomplete,
    onBlur,
    onPush,
    onReplace,
    renderError,
    fieldLoading,
}: ListFieldProps<Values, FieldKey>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const ref = useCombinedRefs(fieldRef, inputRef);

    /* Move the trailing input outside of react life-cycle  */
    const getValue = useCallback(() => inputRef.current!.value, []);
    const setValue = useCallback((value: string) => {
        inputRef.current!.value = value;
        onAutocomplete?.(value);
    }, []);

    const values = (form.values[fieldKey] ?? []) as ListFieldValue<T>[];
    const errors = (form.errors[fieldKey] ?? []) as FormikErrors<ListFieldValue<T>>[];
    const hasItem = Boolean(values) || values.some(({ value }) => !isEmptyString(fieldValue(value)));

    /** For onBlur and onChange events, validation is triggered after a small timeout to
     * prevent flickering error validation. This timeout accommodates scenarios where the
     * user clicks on a possible autocomplete suggestion, potentially triggering the onBlur
     * event, or when the user is actively making changes in the input field. */
    const debouncedValidate = useCallback(
        debounce(() => {
            void form.validateForm();
        }, 250),
        []
    );

    const handleBlur = () => {
        /* Avoid immediate validation when marking the field as touched
         * on blur to prevent error warning for potentially invalid trailing
         * input values before the `onBlur` call. */
        void form.setFieldTouched(fieldKey as string, true, false);
        onBlur?.(getValue());
        debouncedValidate();
    };

    useEffect(() => debouncedValidate.cancel, []);

    return (
        <FieldBox
            icon={icon}
            className={clsx(errors && 'field-two--invalid')}
            onClick={(evt) => {
                evt.preventDefault();
                inputRef.current?.focus();
            }}
        >
            {label && (
                <label
                    htmlFor="next-url-field"
                    className="field-two-label text-sm"
                    style={{ color: hasItem ? 'var(--text-weak)' : 'inherit' }}
                >
                    {label}
                </label>
            )}

            <FieldArray
                name={fieldKey as string}
                render={(helpers) => {
                    const selectAtIndex = (idx: number, direction: 'left' | 'right') => {
                        const span = document.getElementById(values[idx].id);
                        if (!span) return;
                        span.focus();
                        if (direction === 'left') {
                            const range = document.createRange();
                            const textNode = span.firstChild;
                            const selection = getSelection();

                            range.setStart(textNode!, span.innerText.length);
                            range.collapse(true);

                            selection?.removeAllRanges();
                            selection?.addRange(range);
                        }
                    };

                    const handleAdd = () => {
                        debouncedValidate.cancel();
                        const value = getValue().trim();
                        if (value) {
                            helpers.push(onPush(value));
                            setValue('');
                        }
                    };

                    const onKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
                        switch (evt.key) {
                            case 'Enter':
                                evt.preventDefault();
                                handleAdd();
                                break;

                            case 'Backspace':
                                if (getValue().length === 0) {
                                    setValue('');
                                    if (values.length > 0) helpers.pop();
                                }
                                break;

                            case 'ArrowLeft':
                                if (inputRef.current?.selectionStart === 0 && values.length > 0) {
                                    evt.preventDefault();
                                    selectAtIndex(values.length - 1, 'left');
                                }
                                break;

                            case ' ':
                                evt.stopPropagation();
                        }
                    };

                    const onMoveLeft = (idx: number) => () => idx > 0 && selectAtIndex(idx - 1, 'left');

                    const onMoveRight = (idx: number) => () => {
                        if (idx < values.length - 1) selectAtIndex(idx + 1, 'right');
                        else inputRef.current?.focus();
                    };

                    const onChange = (idx: number, entry: ListFieldValue<T>) => (value: string) => {
                        if (value.trim()) helpers.replace<ListFieldValue<unknown>>(idx, onReplace(value, entry));
                        else helpers.remove(idx);
                    };
                    return (
                        <div className="w-full flex-1 relative flex gap-1 max-w-full max-h-full">
                            {values.map((entry, idx) => (
                                <ListFieldItem<T>
                                    {...entry}
                                    key={entry.id}
                                    error={Boolean(errors?.[idx])}
                                    loading={fieldLoading ? fieldLoading(entry) : false}
                                    onChange={onChange(idx, entry)}
                                    onMoveLeft={onMoveLeft(idx)}
                                    onMoveRight={onMoveRight(idx)}
                                    renderValue={fieldValue}
                                />
                            ))}
                            <div
                                className="flex flex-1 shrink-0 max-w-full max-h-full relative min-w-custom"
                                style={{ '--min-w-custom': '5em' }}
                            >
                                <div className="flex-1 flex items-center">
                                    <InputFieldTwo
                                        assistContainerClassName="hidden"
                                        autoFocus={autoFocus}
                                        inputClassName="color-norm px-2 py-1 rounded-none"
                                        onBlur={handleBlur}
                                        onChange={debouncedValidate}
                                        onKeyDown={onKeyDown}
                                        onValue={onAutocomplete}
                                        placeholder={values.length === 0 ? placeholder : ''}
                                        ref={ref}
                                        unstyled
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }}
            />

            {renderError && errors.filter(truthy).length > 0 && form.dirty && (
                <div className="field-two-assist flex flex-nowrap items-start mt-4">
                    <Icon name="exclamation-circle-filled" className="shrink-0 mr-1" />
                    <span>{renderError(errors)}</span>
                </div>
            )}
        </FieldBox>
    );
};

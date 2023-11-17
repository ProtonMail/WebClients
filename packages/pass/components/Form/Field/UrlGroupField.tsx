import type { ReactNode } from 'react';
import { type KeyboardEvent, useRef } from 'react';

import { FieldArray, type FormikContextType, type FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components/';
import type { UrlGroupValues, UrlItem } from '@proton/pass/types';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { isValidURL } from '@proton/pass/utils/url/is-valid-url';

import { FieldBox } from './Layout/FieldBox';

export type UrlGroupProps<V extends UrlGroupValues = UrlGroupValues> = {
    form: FormikContextType<V>;
    renderExtraActions?: (helpers: {
        handleRemove: (idx: number) => () => void;
        handleAdd: (url: string) => void;
        handleReplace: (idx: number) => (url: string) => void;
    }) => ReactNode;
};

export const createNewUrl = (url: string) => ({ id: uniqueId(), url: isValidURL(url).valid ? url : '' });

export const UrlGroupField = <T extends UrlGroupValues>({ form, renderExtraActions }: UrlGroupProps<T>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { values, errors, handleChange } = form;

    const onKeyEnter = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); /* avoid submitting the form */
            event.currentTarget.blur();
        }
    };

    const hasURL = Boolean(values.url) || values.urls.some(({ url }) => !isEmptyString(url));

    return (
        <FieldBox icon="earth">
            <label
                htmlFor="next-url-field"
                className="field-two-label text-sm"
                style={{ color: hasURL ? 'var(--text-weak)' : 'inherit' }}
            >
                {c('Label').t`Websites`}
            </label>

            <FieldArray
                name="urls"
                render={(helpers) => {
                    const handleRemove = helpers.handleRemove;

                    const handleReplace = (index: number) => (url: string) =>
                        helpers.replace(index, { id: values.urls[index].id, url });

                    const handleAdd = (url: string) => {
                        helpers.push(createNewUrl(isValidURL(url).url));
                        return form.setFieldValue('url', '');
                    };

                    return (
                        <>
                            <ul className="unstyled m-0 mb-1">
                                {values.urls.map(({ url, id }, index) => (
                                    <li key={id} className="flex items-center flex-nowrap">
                                        <InputFieldTwo
                                            error={(errors.urls?.[index] as FormikErrors<UrlItem>)?.url}
                                            onValue={handleReplace(index)}
                                            onBlur={() => handleReplace(index)(isValidURL(url).url)}
                                            value={url}
                                            unstyled
                                            assistContainerClassName="hidden-empty"
                                            inputClassName="color-norm p-0 rounded-none"
                                            placeholder="https://"
                                            onKeyDown={onKeyEnter}
                                        />
                                        <Button
                                            icon
                                            pill
                                            className="flex-item-noshrink ml-2"
                                            color="weak"
                                            onClick={handleRemove(index)}
                                            shape="ghost"
                                            size="small"
                                            title={c('Action').t`Delete`}
                                        >
                                            <Icon name="cross" size={20} className="color-weak" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>

                            <InputFieldTwo
                                unstyled
                                id="next-url-field"
                                assistContainerClassName="hidden-empty"
                                inputClassName="color-norm p-0 rounded-none"
                                placeholder="https://"
                                name="url"
                                value={values.url}
                                error={errors.url}
                                onChange={handleChange}
                                onBlur={() => values.url && !errors.url && handleAdd(values.url)}
                                onKeyDown={onKeyEnter}
                                ref={inputRef}
                            />

                            <hr className="mt-3 mb-1" />

                            {renderExtraActions?.({ handleAdd, handleRemove, handleReplace })}

                            <Button
                                icon
                                color="norm"
                                shape="ghost"
                                size="small"
                                title={c('Action').t`Add`}
                                className="flex items-center gap-1"
                                onClick={() => handleAdd(values.url).then(() => inputRef.current?.focus())}
                            >
                                <Icon name="plus" /> {c('Action').t`Add`}
                            </Button>
                        </>
                    );
                }}
            />
        </FieldBox>
    );
};

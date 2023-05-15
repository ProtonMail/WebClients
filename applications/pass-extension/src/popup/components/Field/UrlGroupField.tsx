import { type KeyboardEvent, useRef } from 'react';

import { FieldArray, type FormikContextType, type FormikErrors } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, InputFieldTwo } from '@proton/components/';
import { duplicates } from '@proton/pass/utils/array';
import { isEmptyString, uniqueId } from '@proton/pass/utils/string';
import { isValidURL } from '@proton/pass/utils/url';

import { FieldBox } from './Layout/FieldBox';

export type UrlItem = { url: string; id: string };
export type UrlGroupValues = { url: string; urls: UrlItem[] };
export type UrlGroupProps<V extends UrlGroupValues = UrlGroupValues> = { form: FormikContextType<V> };

export const createNewUrl = (url: string) => ({ id: uniqueId(), url: isValidURL(url).valid ? url : '' });

/* validates the active URL input field */
export const validateUrl = <V extends UrlGroupValues>({ url, urls }: V) => {
    if (!isEmptyString(url)) {
        const { valid: validURL, url: safeUrl } = isValidURL(url);
        const urlExists = urls.map(({ url }) => url).includes(safeUrl);

        if (!validURL) return { url: c('Validation').t`Url is invalid` };
        if (urlExists) return { url: c('Validation').t`Url already exists` };
    }

    return {};
};

/* validates the actual URLs list */
export const validateUrls = <V extends UrlGroupValues>({ urls }: V) => {
    const duplicatesCount = duplicates(urls.map((item) => item.url));

    const urlsErrors = urls.map(({ url }) => {
        const isEmpty = isEmptyString(url);
        const { valid: validURL, url: safeUrl } = isValidURL(url);

        if (isEmpty) return { url: c('Validation').t`Url cannot be empty` };
        if (!validURL) return { url: c('Validation').t`Url is invalid` };
        if ((duplicatesCount.get(safeUrl) ?? 0) > 1) return { url: c('Validation').t`Duplicated url` };

        return {};
    });

    return (urlsErrors.some(({ url }) => url !== undefined) ? { urls: urlsErrors } : {}) as FormikErrors<V>;
};

export const UrlGroupField = <T extends UrlGroupValues>({ form }: UrlGroupProps<T>) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { values, errors, handleChange } = form;

    const onKeyEnter = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); /* avoid submitting the form */
            event.currentTarget.blur();
        }
    };

    return (
        <FieldBox icon={<Icon name="earth" size={20} style={{ color: 'var(--fieldset-cluster-icon-color)' }} />}>
            <label
                htmlFor="next-url-field"
                className="field-two-label-container flex flex-justify-space-between flex-nowrap flex-align-items-end gap-2 color-norm text-normal"
            >
                <span className="field-two-label color-weak text-sm">{c('Label').t`Websites`}</span>
            </label>

            <FieldArray
                name="urls"
                render={(helpers) => {
                    const handleRemove = helpers.handleRemove;

                    const handleReplace = (index: number) => (url: string) =>
                        helpers.replace(index, { id: values.urls[index].id, url });

                    const handleAdd = (url: string) => {
                        helpers.push(createNewUrl(isValidURL(url).url));
                        form.setFieldValue('url', '');
                    };

                    return (
                        <>
                            <ul className="unstyled m-0">
                                {values.urls.map(({ url, id }, index) => (
                                    <li key={id}>
                                        <div className="flex flex-align-items-center flex-nowrap">
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
                                                className="flex-item-noshrink flex-align-self-start ml-2"
                                                color="weak"
                                                shape="ghost"
                                                size="small"
                                                title={c('Action').t`Delete`}
                                                onClick={handleRemove(index)}
                                                style={{ padding: 0 }}
                                            >
                                                <Icon name="cross" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <InputFieldTwo
                                id="next-url-field"
                                unstyled
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

                            <Button
                                icon
                                color="norm"
                                shape="ghost"
                                size="small"
                                title={c('Action').t`Add`}
                                className="flex flex-align-items-center gap-1 mt-1"
                                onClick={() => {
                                    handleAdd(values.url);
                                    inputRef.current?.focus();
                                }}
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

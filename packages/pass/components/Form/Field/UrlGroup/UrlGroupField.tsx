import type { FC, ReactNode } from 'react';
import { type KeyboardEvent, useRef } from 'react';

import { FieldArray, type FormikErrors, useFormikContext } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { useFeatureFlag } from '../../../../hooks/useFeatureFlag';
import { maybeErrorMessage } from '../../../../hooks/useFieldControl';
import { createNewUrlItem, getModeDescription, isAutofillModeDataOfTypeUrl } from '../../../../lib/urls/utils/autofill';
import { sanitizeURL } from '../../../../lib/urls/utils/sanitize';
import type { UrlGroupValues, UrlItem } from '../../../../types';
import { PassFeature } from '../../../../types/api/features';
import { AutofillMode } from '../../../../types/protobuf';
import { isEmptyString } from '../../../../utils/string/is-empty-string';
import { FieldBox } from '../Layout/FieldBox';
import { UrlAdvancedModal } from './UrlAdvancedModal';

export type UrlGroupProps = {
    initialTestUrl?: string;
    renderExtraActions?: (helpers: {
        handleRemove: (idx: number) => () => void;
        handleAdd: (url: string) => void;
        handleReplace: (idx: number) => (url: string) => void;
    }) => ReactNode;
};

export const UrlGroupField: FC<UrlGroupProps> = ({ initialTestUrl, renderExtraActions }) => {
    const advancedModesEnabled = useFeatureFlag(PassFeature.PassAutofillUrlAdvancedModes);
    const inputRef = useRef<HTMLInputElement>(null);
    const { values, errors, handleChange, setFieldValue } = useFormikContext<UrlGroupValues>();

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
                    const handleEdit = (index: number) => () => setFieldValue('editingUrlIndex', index);

                    const handleRemove = helpers.handleRemove;

                    const handleReplace = (index: number) => (url: string) =>
                        helpers.replace(index, { ...values.urls[index], url });

                    const handleSanitize = (index: number) => () => {
                        const item = values.urls[index];
                        if (isAutofillModeDataOfTypeUrl(item.mode)) handleReplace(index)(sanitizeURL(item.url).url);
                    };

                    const handleAdd = (url: string) => {
                        helpers.push(createNewUrlItem({ url: sanitizeURL(url).url, mode: AutofillMode.Default }));
                        return setFieldValue('url', '');
                    };

                    return (
                        <>
                            <ul className="unstyled m-0 mb-1 flex flex-column gap-1 pt-2">
                                {values.urls.map(({ url, id, mode }, index) => (
                                    <li
                                        key={id}
                                        className="flex items-center flex-nowrap bg-norm border border-weak rounded-lg px-2"
                                    >
                                        <div className="w-full flex flex-column py-1">
                                            <InputFieldTwo
                                                error={(errors.urls?.[index] as FormikErrors<UrlItem>)?.url}
                                                onValue={handleReplace(index)}
                                                onBlur={handleSanitize(index)}
                                                value={url}
                                                unstyled
                                                assistContainerClassName="empty:hidden"
                                                inputClassName="color-norm p-0 rounded-none"
                                                placeholder="https://"
                                                onKeyDown={onKeyEnter}
                                                data-protonpass-ignore={true}
                                            />
                                            {mode === AutofillMode.Default ? null : (
                                                <p className="color-weak">{getModeDescription(mode)}</p>
                                            )}
                                        </div>
                                        {advancedModesEnabled && (
                                            <Button
                                                icon
                                                pill
                                                className="shrink-0 ml-2"
                                                color="weak"
                                                onClick={handleEdit(index)}
                                                shape="ghost"
                                                size="small"
                                                title={c('Action').t`Edit`}
                                            >
                                                <IcCogWheel size={5} className="color-weak" />
                                            </Button>
                                        )}
                                        <Button
                                            icon
                                            pill
                                            className="shrink-0 ml-2"
                                            color="weak"
                                            onClick={handleRemove(index)}
                                            shape="ghost"
                                            size="small"
                                            title={c('Action').t`Delete`}
                                        >
                                            <IcCross size={5} className="color-weak" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>

                            <InputFieldTwo
                                unstyled
                                id="next-url-field"
                                assistContainerClassName="empty:hidden"
                                inputClassName="color-norm p-0 pt-2 rounded-none"
                                placeholder="https://"
                                name="url"
                                value={values.url}
                                error={maybeErrorMessage(errors.url)}
                                onChange={handleChange}
                                onBlur={() => values.url && !errors.url && handleAdd(values.url)}
                                onKeyDown={onKeyEnter}
                                ref={inputRef}
                                data-protonpass-ignore={true}
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
                                <IcPlus /> {c('Action').t`Add`}
                            </Button>
                        </>
                    );
                }}
            />
            <UrlAdvancedModal
                open={values.editingUrlIndex !== null}
                onClose={() => setFieldValue('editingUrlIndex', null)}
                initialTestUrl={initialTestUrl}
                index={values.editingUrlIndex}
            />
        </FieldBox>
    );
};

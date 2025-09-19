import { type FC, useState } from 'react';

import type { FormikContextType } from 'formik';
import { Field } from 'formik';
import type { EntryAlgorithm, EntryDTO, EntryType } from 'proton-authenticator/lib/entries/items';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ButtonGroup, Option } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';

const ALGORITHM_OPTIONS: EntryAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
const TYPE_OPTIONS: EntryType[] = ['Totp', 'Steam'];

type Props = { form: FormikContextType<EntryDTO> };

export const ItemForm: FC<Props> = ({ form }) => {
    const [showExtra, setShowExtra] = useState(false);

    return (
        <>
            <FieldsetCluster className="w-full">
                <Field
                    name="name"
                    label={c('authenticator-2025:Label').t`Title`}
                    placeholder={c('authenticator-2025:Label').t`Title, account, or label`}
                    autoFocus
                    component={TextField}
                />
            </FieldsetCluster>

            <FieldsetCluster className="w-full">
                <Field
                    name="secret"
                    label={c('authenticator-2025:Label').t`Secret`}
                    placeholder={c('authenticator-2025:Label').t`Secret key`}
                    component={TextField}
                />
            </FieldsetCluster>

            <FieldsetCluster className="w-full">
                <Field
                    name="issuer"
                    label={c('authenticator-2025:Label').t`Issuer`}
                    placeholder={c('authenticator-2025:Label').t`Issuer`}
                    component={TextField}
                />
            </FieldsetCluster>

            {/* TOTP-only params */}
            {showExtra && (
                <>
                    {form.values.type !== 'Steam' && (
                        <>
                            <InlineFieldBox
                                size="lg"
                                className="w-full"
                                label={c('authenticator-2025:Label').t`Digits`}
                            >
                                <Field name="digits" required component={SelectField} className="select field">
                                    {Array.from({ length: 3 }).map((_, i) => {
                                        // We just support 6, 7 and 8
                                        const n = i + 6;
                                        return <Option key={`digits-${i}`} title={n.toString()} value={n} />;
                                    })}
                                </Field>
                            </InlineFieldBox>

                            <InlineFieldBox
                                size="lg"
                                className="w-full"
                                label={c('authenticator-2025:Label').t`Time interval`}
                            >
                                <Field name="period" required component={SelectField} className="select field">
                                    <Option
                                        key="period-30"
                                        title={c('authenticator-2025:Label').t`30 seconds`}
                                        value={30}
                                    />
                                    <Option
                                        key="period-60"
                                        title={c('authenticator-2025:Label').t`60 seconds`}
                                        value={60}
                                    />
                                </Field>
                            </InlineFieldBox>

                            <InlineFieldBox
                                size="lg"
                                className="w-full"
                                label={c('authenticator-2025:Label').t`Algorithm`}
                            >
                                <ButtonGroup color="weak" shape="outline">
                                    {ALGORITHM_OPTIONS.map((algorithm) => (
                                        <Button
                                            key={`item-form-${algorithm}`}
                                            onClick={() => form.setFieldValue('algorithm', algorithm)}
                                            selected={form.values.algorithm === algorithm}
                                        >
                                            {algorithm}
                                        </Button>
                                    ))}
                                </ButtonGroup>
                            </InlineFieldBox>
                        </>
                    )}

                    <InlineFieldBox className="w-full" label={c('authenticator-2025:Label').t`Type`}>
                        <ButtonGroup color="weak" shape="outline">
                            {TYPE_OPTIONS.map((type) => (
                                <Button
                                    key={`item-form-${type}`}
                                    onClick={() => form.setFieldValue('type', type)}
                                    selected={form.values.type === type}
                                >
                                    {type.toUpperCase()}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </InlineFieldBox>
                </>
            )}

            {!showExtra && (
                <Button
                    color="weak"
                    shape="ghost"
                    className="flex items-center mr-auto"
                    onClick={() => setShowExtra(!showExtra)}
                >
                    {c('authenticator-2025:Label').t`Advanced options`}
                    <Icon name="plus" className="ml-2" />
                </Button>
            )}
        </>
    );
};

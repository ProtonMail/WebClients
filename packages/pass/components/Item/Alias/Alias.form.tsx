import { type FC, type PropsWithChildren, useEffect, useState } from 'react';

import { type FormikContextType } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Option } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import type { SanitizedAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import type { AliasFormValues, AliasMailbox, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type AliasFormProps<V extends AliasFormValues> = {
    aliasOptions: MaybeNull<SanitizedAliasOptions>;
    disabled?: boolean;
    form: FormikContextType<V>;
    loading: boolean;
};

const AliasFormBase: FC<
    PropsWithChildren<{
        disabled: boolean;
        loading: boolean;
        mailboxes: AliasMailbox[];
        toggleShowAdvanced: () => void;
    }>
> = ({ children, disabled, loading, mailboxes, toggleShowAdvanced }) => {
    return (
        <>
            <div className="flex justify-end mb-2">
                <Button shape="ghost" onClick={toggleShowAdvanced}>
                    <span className="flex items-center color-weak text-sm">
                        <Icon name="cog-wheel" className="mr-1" />
                        {c('Action').t`Advanced options`}
                    </span>
                </Button>
            </div>
            {children}
            <FieldsetCluster>
                <Field
                    name="mailboxes"
                    label={c('Label').t`Forwards to`}
                    placeholder={c('Label').t`Select an email address`}
                    component={SelectField}
                    icon="arrow-up-and-right-big"
                    multiple
                    disabled={disabled || mailboxes.length <= 1}
                    loading={loading}
                >
                    {mailboxes.map((mailbox) => (
                        <Option value={mailbox} title={mailbox.email} key={mailbox.id}>
                            {mailbox.email}
                        </Option>
                    ))}
                </Field>
            </FieldsetCluster>
        </>
    );
};

export const AliasForm = <V extends AliasFormValues>({ form, loading, aliasOptions, disabled }: AliasFormProps<V>) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const toggleShowAdvanced = () => setShowAdvanced((state) => !state);
    const disabledForm = disabled || loading || aliasOptions === null;

    const wrapperProps = {
        disabled: disabledForm,
        loading,
        mailboxes: aliasOptions?.mailboxes ?? [],
        toggleShowAdvanced,
    };

    useEffect(() => {
        /** Controls automatic alias prefix derivation by toggling the field's `touched` state.
         * When in basic mode, keeps the field untouched to allow automatic derivation from name.
         * When in advanced mode, marks as touched to prevent automatic derivation. */
        if (showAdvanced) form.setFieldTouched('aliasPrefix', true).catch(noop);
        if (!showAdvanced && form.errors.aliasPrefix) form.setFieldTouched('aliasPrefix', false).catch(noop);
    }, [showAdvanced]);

    return (
        <AliasFormBase {...wrapperProps}>
            {showAdvanced && (
                <FieldsetCluster>
                    <Field
                        name="aliasPrefix"
                        label={c('Label').t`Prefix`}
                        placeholder={c('Placeholder').t`Enter a prefix`}
                        component={TextField}
                    />
                    <Field
                        name="aliasSuffix"
                        label={c('Label').t`Suffix`}
                        placeholder={c('Placeholder').t`Select a suffix`}
                        component={SelectField}
                        disabled={disabledForm}
                        loading={loading}
                    >
                        {(aliasOptions?.suffixes ?? []).map((suffix) => (
                            <Option key={suffix.value} value={suffix} title={suffix.value}>
                                {suffix.value}
                            </Option>
                        ))}
                    </Field>
                </FieldsetCluster>
            )}
        </AliasFormBase>
    );
};

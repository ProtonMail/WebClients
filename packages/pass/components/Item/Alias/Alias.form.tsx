import { type FC, type PropsWithChildren, useEffect } from 'react';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { Option } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SpotlightGradient } from '@proton/pass/components/Spotlight/SpotlightGradient';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { WithSpotlight } from '@proton/pass/components/Spotlight/WithSpotlight';
import type { SanitizedAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { type AliasFormValues, type AliasMailbox, type MaybeNull, SpotlightMessage } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type AliasFormProps<V extends AliasFormValues> = {
    aliasOptions: MaybeNull<SanitizedAliasOptions>;
    disabled?: boolean;
    form: FormikContextType<V>;
    loading: boolean;
    showAdvanced: boolean;
};

const AliasFormBase: FC<
    PropsWithChildren<{
        disabled: boolean;
        loading: boolean;
        mailboxes: AliasMailbox[];
        handleSpotlightActionClick: () => void;
    }>
> = ({ children, disabled, loading, mailboxes, handleSpotlightActionClick }) => {
    return (
        <>
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

            <WithSpotlight type={SpotlightMessage.ALIAS_DISCOVERY_MAILBOX}>
                {({ close }) => (
                    <SpotlightGradient
                        title={c('Title').t`Did you know?`}
                        message={c('Info').t`Share aliases with others by adding their inbox as a forwarding mailbox.`}
                        onClose={close}
                        action={{
                            label: c('Action').t`Add forwarding mailbox`,
                            onClick: handleSpotlightActionClick,
                        }}
                        className="mb-2"
                        withArrow
                    />
                )}
            </WithSpotlight>
        </>
    );
};

export const AliasForm = <V extends AliasFormValues>({
    form,
    loading,
    aliasOptions,
    disabled,
    showAdvanced,
}: AliasFormProps<V>) => {
    const { openSettings } = usePassCore();
    const { acknowledge } = useSpotlight();

    const disabledForm = disabled || loading || aliasOptions === null;

    /** Acknowledge both alias domain and mailbox spotlights because both spotlights open the same page */
    const handleSpotlightActionClick = () => {
        acknowledge(SpotlightMessage.ALIAS_DISCOVERY_MAILBOX);
        acknowledge(SpotlightMessage.ALIAS_DISCOVERY_DOMAIN);
        openSettings?.('aliases');
    };

    const wrapperProps = {
        disabled: disabledForm,
        loading,
        mailboxes: aliasOptions?.mailboxes ?? [],
        handleSpotlightActionClick,
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
                <>
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

                    <WithSpotlight type={SpotlightMessage.ALIAS_DISCOVERY_DOMAIN}>
                        {({ close }) => (
                            <SpotlightGradient
                                title={c('Title').t`Did you know?`}
                                message={c('Info')
                                    .t`By adding your domain, you can create aliases like hi@my-domain.com.`}
                                onClose={close}
                                action={{
                                    label: c('Action').t`Add domain`,
                                    onClick: handleSpotlightActionClick,
                                }}
                                className="mb-2"
                                withArrow
                            />
                        )}
                    </WithSpotlight>
                </>
            )}
        </AliasFormBase>
    );
};

import { type FC, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { AliasForm } from '@proton/pass/components/Item/Alias/Alias.form';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { deriveAliasPrefix, reconciliateAliasFromDraft, validateNewAliasForm } from '@proton/pass/lib/validation/alias';
import { selectAliasLimits, selectUserVerified, selectVaultLimits } from '@proton/pass/store/selectors';
import type { MaybeNull, NewAliasFormValues } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { resolveDomain } from '@proton/pass/utils/url/utils';

const FORM_ID = 'new-alias';

export const AliasNew: FC<ItemNewViewProps<'alias'>> = ({ shareId, url, onSubmit, onCancel }) => {
    const { needsUpgrade } = useSelector(selectAliasLimits);
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const userVerified = useSelector(selectUserVerified);
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<NewAliasFormValues>>());
    const reconciled = useRef(false);
    const { ParentPortal, openPortal } = usePortal();

    const { aliasPrefix: defaultAliasPrefix, ...defaults } = useMemo(() => {
        const domain = url ? resolveDomain(url) : null;

        return domain
            ? { name: domain, note: c('Placeholder').t`Used on ${url}`, aliasPrefix: deriveAliasPrefix(domain) }
            : { name: '', note: '', aliasPrefix: '' };
    }, []);

    /* set initial `aliasPrefix` to an empty string to avoid a
     * form error state if `aliasOptions` have not loaded yet */
    const initialValues: NewAliasFormValues = useMemo(
        () => ({
            shareId,
            aliasPrefix: '',
            aliasSuffix: undefined,
            mailboxes: [],
            ...defaults,
        }),
        []
    );

    const form = useFormik<NewAliasFormValues>({
        initialValues,
        initialErrors: validateNewAliasForm(initialValues),
        onSubmit: ({ name, note, shareId, aliasPrefix, aliasSuffix, mailboxes }) => {
            if (needsUpgrade) return;

            if (aliasPrefix !== undefined && aliasSuffix !== undefined) {
                const optimisticId = uniqueId();

                onSubmit({
                    type: 'alias',
                    optimisticId,
                    shareId,
                    createTime: getEpoch(),
                    metadata: {
                        name,
                        note: obfuscate(note),
                        itemUuid: optimisticId,
                    },
                    content: {},
                    extraFields: [],
                    extraData: {
                        mailboxes,
                        prefix: aliasPrefix,
                        signedSuffix: aliasSuffix.signature,
                        aliasEmail: aliasPrefix + aliasSuffix.value,
                    },
                });
            }
        },
        validate: validateNewAliasForm,
        validateOnChange: true,
        validateOnMount: false,
    });

    const draft = useItemDraft<NewAliasFormValues>(form, {
        type: 'alias',
        mode: 'new',
        onHydrated: draftHydrated.resolve,
    });

    const aliasOptions = useAliasOptions({
        shareId,
        onAliasOptionsLoaded: async (options) => {
            const draft = await draftHydrated;
            const formValues = draft ?? form.values;

            const firstSuffix = options.suffixes[0];
            const firstMailBox = options.mailboxes[0];
            const prefixFromURL = !isEmptyString(defaultAliasPrefix);
            const aliasPrefix = prefixFromURL ? defaultAliasPrefix : deriveAliasPrefix(formValues.name);

            const defaultAlias = { aliasPrefix, aliasSuffix: firstSuffix, mailboxes: [firstMailBox] };
            const draftAlias = draft ? reconciliateAliasFromDraft(formValues, options, defaultAlias) : null;

            const values = { ...formValues, ...(draftAlias ?? defaultAlias) };
            const errors = validateNewAliasForm(values);

            if (draft) {
                await form.setValues(values, true);
                await form.setTouched({ aliasPrefix: deriveAliasPrefix(draft.name) !== draft.aliasPrefix });
                form.setErrors(errors);
            } else form.resetForm({ values, errors, touched: { aliasPrefix: false } });

            reconciled.current = true;
        },
        lazy: !userVerified,
    });

    const { values, touched, setFieldValue } = form;
    const { name, aliasPrefix, aliasSuffix } = values;
    const ready = !aliasOptions.loading;

    useEffect(() => {
        if (reconciled.current) {
            const allowPrefixDerivation = !touched.aliasPrefix;
            if (allowPrefixDerivation) void setFieldValue('aliasPrefix', deriveAliasPrefix(name));
        }
    }, [name]);

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            submitButton={needsUpgrade && <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_ALIAS} />}
            type="alias"
            valid={ready && form.isValid && userVerified && !needsUpgrade}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <>
                    {needsUpgrade && (
                        <Card className="mb-2 text-sm" type="primary">
                            {c('Info')
                                .t`You have reached the limit of aliases you can create. Create an unlimited number of aliases when you upgrade your subscription.`}
                        </Card>
                    )}

                    {!userVerified && (
                        <Card className="mb-2 text-sm" type="primary">
                            {c('Warning').t`Please verify your email address in order to use email aliases`}
                        </Card>
                    )}

                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                {vaultTotalCount > 1 &&
                                    openPortal(
                                        <Field component={VaultPickerField} name="shareId" className="h-full" dense />
                                    )}
                                <Field
                                    lengthLimiters
                                    name="name"
                                    label={c('Label').t`Title`}
                                    placeholder={c('Label').t`Untitled`}
                                    component={TitleField}
                                    autoFocus={!draft && didEnter && ready && !needsUpgrade}
                                    key={`alias-name-${didEnter}-${ready}`}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                    disabled={!(userVerified && ready)}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster mode="read" as="div">
                                <ValueControl
                                    icon="alias"
                                    label={c('Label').t`You are about to create`}
                                    loading={!ready}
                                    error={Boolean(
                                        Object.keys(form.touched).length > 0 &&
                                            (form.errors.aliasPrefix || form.errors.aliasSuffix)
                                    )}
                                >
                                    {`${aliasPrefix}${aliasSuffix?.value ?? ''}`}
                                </ValueControl>
                            </FieldsetCluster>

                            <AliasForm aliasOptions={aliasOptions.value} loading={!ready} form={form} />

                            <FieldsetCluster>
                                <Field
                                    name="note"
                                    label={c('Label').t`Note`}
                                    placeholder={c('Placeholder').t`Enter a note...`}
                                    component={TextAreaField}
                                    icon="note"
                                    maxLength={MAX_ITEM_NOTE_LENGTH}
                                    disabled={!userVerified}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </>
            )}
        </ItemCreatePanel>
    );
};

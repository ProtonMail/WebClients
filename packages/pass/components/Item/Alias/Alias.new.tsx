import { type VFC, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultSelectField } from '@proton/pass/components/Form/Field/VaultSelectField';
import { AliasForm } from '@proton/pass/components/Item/Alias/Alias.form';
import { ItemCard } from '@proton/pass/components/Item/ItemCard';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { useDraftSync } from '@proton/pass/hooks/useItemDraft';
import { deriveAliasPrefix, reconciliateAliasFromDraft, validateNewAliasForm } from '@proton/pass/lib/validation/alias';
import { selectAliasLimits, selectUserVerified, selectVaultLimits } from '@proton/pass/store/selectors';
import type { MaybeNull, NewAliasFormValues } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import noop from '@proton/utils/noop';

const FORM_ID = 'new-alias';

export const AliasNew: VFC<ItemNewViewProps<'alias'>> = ({ shareId, url, onSubmit, onCancel }) => {
    const { domain, subdomain, displayName } = url ?? {};
    const { needsUpgrade } = useSelector(selectAliasLimits);
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const userVerified = useSelector(selectUserVerified);
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<NewAliasFormValues>>());

    const { aliasPrefix: defaultAliasPrefix, ...defaults } = useMemo(() => {
        const url = subdomain ?? domain ?? '';
        const validURL = url !== null;

        return {
            name: validURL ? url : '',
            note: validURL ? c('Placeholder').t`Used on ${url}` : '',
            aliasPrefix: displayName ? deriveAliasPrefix(displayName) : '',
        };
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
                await form.setValues(values);
                form.setErrors(errors);
            } else form.resetForm({ values, errors });
        },
        lazy: !userVerified,
    });

    const draft = useDraftSync<NewAliasFormValues>(form, {
        type: 'alias',
        mode: 'new',
        itemId: 'draft-alias',
        shareId: form.values.shareId,
        onHydrated: draftHydrated.resolve,
    });

    const { values, touched, setFieldValue } = form;
    const { name, aliasPrefix, aliasSuffix } = values;

    useEffect(() => {
        /* update the aliasPrefix with the item's name only :
        - if it hasn't been touched by the user yet
        - a default alias prefix was not resolved  */
        void draftHydrated.then((hydrated) => {
            if (!hydrated && !defaultAliasPrefix && !touched.aliasPrefix) {
                setFieldValue('aliasPrefix', deriveAliasPrefix(name), true).catch(noop);
            }
        });
    }, [name, touched.aliasPrefix]);

    return (
        <ItemCreatePanel
            type="alias"
            formId={FORM_ID}
            handleCancelClick={onCancel}
            valid={form.isValid && userVerified}
            discardable={!form.dirty}
            /* if user has reached his alias limit: disable submit and prompt for upgrade */
            renderSubmitButton={needsUpgrade ? <UpgradeButton key="upgrade-button" /> : undefined}
        >
            {({ didEnter }) => (
                <>
                    {needsUpgrade && (
                        <ItemCard className="mb-2">
                            {c('Info')
                                .t`You have reached the limit of aliases you can create. Create an unlimited number of aliases when you upgrade your subscription.`}
                        </ItemCard>
                    )}

                    {!userVerified && (
                        <ItemCard className="mb-2">
                            {c('Warning').t`Please verify your email address in order to use email aliases`}
                        </ItemCard>
                    )}

                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                {vaultTotalCount > 1 && (
                                    <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                                )}
                                <Field
                                    lengthLimiters
                                    name="name"
                                    label={c('Label').t`Title`}
                                    placeholder={c('Label').t`Untitled`}
                                    component={TitleField}
                                    autoFocus={!draft && didEnter && !needsUpgrade}
                                    key={`alias-name-${didEnter}`}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                    disabled={!userVerified}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster mode="read" as="div">
                                <ValueControl
                                    icon="alias"
                                    label={c('Label').t`You are about to create`}
                                    loading={aliasOptions.loading}
                                    error={Boolean(
                                        Object.keys(form.touched).length > 0 &&
                                            (form.errors.aliasPrefix || form.errors.aliasSuffix)
                                    )}
                                >
                                    {`${aliasPrefix}${aliasSuffix?.value ?? ''}`}
                                </ValueControl>
                            </FieldsetCluster>

                            <AliasForm aliasOptions={aliasOptions.value} loading={aliasOptions.loading} form={form} />

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

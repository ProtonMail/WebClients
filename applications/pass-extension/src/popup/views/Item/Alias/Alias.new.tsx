import { type VFC, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectAliasLimits, selectVaultLimits } from '@proton/pass/store';
import type { MaybeNull } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { merge } from '@proton/pass/utils/object';
import { isEmptyString, uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import noop from '@proton/utils/noop';

import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import type { NewAliasFormValues } from '../../../../shared/form/types';
import { validateNewAliasForm } from '../../../../shared/form/validator/validate-alias';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import { useAliasOptions } from '../../../../shared/hooks/useAliasOptions';
import { type ItemNewProps } from '../../../../shared/items';
import { deriveAliasPrefix, reconciliateAliasFromDraft } from '../../../../shared/items/alias';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { VaultSelectField } from '../../../components/Field/VaultSelectField';
import { ItemCard } from '../../../components/Item/ItemCard';
import { ItemCreatePanel } from '../../../components/Panel/ItemCreatePanel';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { usePopupContext } from '../../../hooks/usePopupContext';
import { AliasForm } from './Alias.form';

const FORM_ID = 'new-alias';

export const AliasNew: VFC<ItemNewProps<'alias'>> = ({ shareId, onSubmit, onCancel }) => {
    const { domain, subdomain, displayName } = usePopupContext().url;
    const { needsUpgrade } = useSelector(selectAliasLimits);
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<NewAliasFormValues>>());

    const { aliasPrefix: defaultAliasPrefix, ...defaults } = useMemo(() => {
        const url = subdomain ?? domain;
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
                        note,
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

    const { aliasOptions, aliasOptionsLoading } = useAliasOptions({
        shareId,
        onAliasOptionsLoaded: async ({ suffixes, mailboxes }) => {
            const draft = await draftHydrated;
            const formValues = draft ?? form.values;

            const firstSuffix = suffixes?.[0];
            const firstMailBox = mailboxes?.[0];
            const prefixFromURL = !isEmptyString(defaultAliasPrefix);
            const aliasPrefix = prefixFromURL ? defaultAliasPrefix : deriveAliasPrefix(formValues.name);

            const values = merge(formValues, {
                aliasPrefix: formValues.aliasPrefix ? formValues.aliasPrefix : aliasPrefix,
                aliasSuffix: formValues.aliasSuffix ?? firstSuffix,
                mailboxes: formValues.mailboxes.length > 0 ? formValues.mailboxes : [firstMailBox],
            });

            if (!draft) form.resetForm({ values, errors: validateNewAliasForm(values) });
        },
    });

    const draft = useItemDraft<NewAliasFormValues>(form, {
        type: 'alias',
        mode: 'new',
        itemId: 'draft-alias',
        shareId: form.values.shareId,
        onHydrated: draftHydrated.resolve,
        sanitize: (formData) => {
            const aliasValues = reconciliateAliasFromDraft(formData, aliasOptions);
            return { ...formData, ...aliasValues };
        },
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
            valid={form.isValid}
            discardable={!form.dirty}
            /* if user has reached his alias limit: disable submit and prompt for upgrade */
            renderSubmitButton={needsUpgrade ? <UpgradeButton key="upgrade-button" /> : undefined}
        >
            {({ didMount }) => (
                <>
                    {needsUpgrade && (
                        <ItemCard className="mb-2">
                            {c('Info')
                                .t`You have reached the limit of aliases you can create. Create an unlimited number of aliases when you upgrade your subscription.`}
                        </ItemCard>
                    )}
                    <FormikProvider value={form}>
                        <Form id={FORM_ID}>
                            <FieldsetCluster>
                                {vaultTotalCount > 1 && (
                                    <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                                )}
                                <Field
                                    name="name"
                                    label={c('Label').t`Title`}
                                    placeholder={c('Label').t`Untitled`}
                                    component={TitleField}
                                    autoFocus={!draft && didMount && !needsUpgrade}
                                    key={`alias-name-${didMount}`}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster mode="read" as="div">
                                <ValueControl
                                    icon="alias"
                                    label={c('Label').t`You are about to create`}
                                    loading={aliasOptionsLoading}
                                    invalid={Boolean(
                                        Object.keys(form.touched).length > 0 &&
                                            (form.errors.aliasPrefix || form.errors.aliasSuffix)
                                    )}
                                >
                                    {`${aliasPrefix}${aliasSuffix?.value ?? ''}`}
                                </ValueControl>
                            </FieldsetCluster>

                            <AliasForm aliasOptions={aliasOptions} loading={aliasOptionsLoading} form={form} />

                            <FieldsetCluster>
                                <Field
                                    name="note"
                                    label={c('Label').t`Note`}
                                    placeholder={c('Placeholder').t`Enter a note...`}
                                    component={TextAreaField}
                                    icon="note"
                                    maxLength={MAX_ITEM_NOTE_LENGTH}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </>
            )}
        </ItemCreatePanel>
    );
};

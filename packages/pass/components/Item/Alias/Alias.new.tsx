import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';
import { FileAttachmentsField } from '@proton/pass/components/FileAttachments/FileAttachmentsField';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { VaultPickerField } from '@proton/pass/components/Form/Field/VaultPickerField';
import { AliasForm } from '@proton/pass/components/Item/Alias/Alias.form';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { ItemCreatePanel } from '@proton/pass/components/Layout/Panel/ItemCreatePanel';
import { SpotlightGradient } from '@proton/pass/components/Spotlight/SpotlightGradient';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import type { ItemNewViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '@proton/pass/constants';
import { useAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { usePortal } from '@proton/pass/hooks/usePortal';
import { deriveAliasPrefix } from '@proton/pass/lib/alias/alias.utils';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { reconciliateAliasFromDraft, validateNewAliasForm } from '@proton/pass/lib/validation/alias';
import { selectAliasLimits, selectVaultLimits } from '@proton/pass/store/selectors';
import { type MaybeNull, type NewAliasFormValues, SpotlightMessage } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { resolveDomain } from '@proton/pass/utils/url/utils';

const FORM_ID = 'new-alias';

/** NOTE: extracted to avoid translation with duplicate variable keys.
 * see `proton-pass-extension/src/app/worker/services/alias.ts` */
const getPlaceholderNote = (url: string) => c('Placeholder').t`Used on ${url}`;

export const AliasNew: FC<ItemNewViewProps<'alias'>> = ({ shareId, url, onSubmit, onCancel }) => {
    const { ParentPortal, openPortal } = usePortal();
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<NewAliasFormValues>>());

    const [reconciled, setReconciled] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const customizeAliasDiscovery = useSpotlightFor(SpotlightMessage.ALIAS_DISCOVERY_CUSTOMIZE);

    const toggleShowAdvanced = () => {
        if (customizeAliasDiscovery.open) customizeAliasDiscovery.close();
        setShowAdvanced((state) => !state);
    };

    const { needsUpgrade } = useSelector(selectAliasLimits);
    const { vaultTotalCount } = useSelector(selectVaultLimits);

    const { aliasPrefix: defaultAliasPrefix, ...defaults } = useMemo(() => {
        const domain = url ? resolveDomain(url) : null;

        return domain
            ? { name: domain, note: getPlaceholderNote(domain), aliasPrefix: deriveAliasPrefix(domain) }
            : { name: '', note: '', aliasPrefix: '' };
    }, []);

    /* set initial `aliasPrefix` to an empty string to avoid a
     * form error state if `aliasOptions` have not loaded yet */
    const initialValues = useMemo<NewAliasFormValues>(
        () => ({
            shareId,
            aliasPrefix: '',
            aliasSuffix: undefined,
            files: filesFormInitializer(),
            mailboxes: [],
            ...defaults,
        }),
        []
    );

    const form = useFormik<NewAliasFormValues>({
        initialValues,
        onSubmit: ({ name, note, shareId, aliasPrefix, aliasSuffix, mailboxes, files }) => {
            if (needsUpgrade) return;

            if (aliasPrefix !== undefined && aliasSuffix !== undefined) {
                const optimisticId = uniqueId();

                onSubmit({
                    type: 'alias',
                    optimisticId,
                    shareId,
                    metadata: {
                        name,
                        note: obfuscate(note),
                        itemUuid: optimisticId,
                    },
                    files,
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
        validateOnMount: true,
    });

    const draft = useItemDraft<NewAliasFormValues>(form, {
        type: 'alias',
        mode: 'new',
        onHydrated: draftHydrated.resolve,
    });

    const aliasOptions = useAliasOptions({
        shareId,
        onAliasOptions: async (res) => {
            try {
                if (!res.ok) return;

                const options = res.aliasOptions;
                const draft = await draftHydrated;
                const formValues = draft ?? form.values;

                const firstSuffix = options.suffixes[0];
                const firstMailBox = options.mailboxes[0];
                const prefixFromURL = !isEmptyString(defaultAliasPrefix);
                const aliasPrefix = prefixFromURL ? defaultAliasPrefix : deriveAliasPrefix(formValues.name);

                const defaultAlias = { aliasPrefix, aliasSuffix: firstSuffix, mailboxes: [firstMailBox] };
                const draftAlias = draft ? reconciliateAliasFromDraft(formValues, options, defaultAlias) : null;

                const values = { ...formValues, ...(draftAlias ?? defaultAlias) };
                const errors = await validateNewAliasForm(values);

                if (draft) {
                    await form.setTouched({ aliasPrefix: deriveAliasPrefix(draft.name) !== draft.aliasPrefix }, false);
                    await form.setValues(values, true);
                    form.setErrors(errors);
                } else form.resetForm({ values, errors, touched: {} });
            } finally {
                setReconciled(true);
            }
        },
    });

    const { values, touched, isValid, status, errors, setFieldValue } = form;
    const { name, aliasPrefix, aliasSuffix } = values;
    const { unverified, loading } = aliasOptions;

    const canCreate = !(unverified || needsUpgrade);
    const valid = canCreate && !loading && isValid && !status?.isBusy;

    const gearIcon = <Icon name="cog-wheel" key="alias-customize-icon" />;

    useEffect(() => {
        if (reconciled) {
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
            valid={valid}
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

                    {unverified && (
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
                                    autoFocus={!draft && didEnter && !loading && !needsUpgrade}
                                    key={`alias-name-${didEnter}-${loading}`}
                                    maxLength={MAX_ITEM_NAME_LENGTH}
                                    disabled={unverified || loading}
                                />
                            </FieldsetCluster>

                            <FieldsetCluster mode="read" as="div">
                                <ValueControl
                                    icon="alias"
                                    label={c('Label').t`You are about to create`}
                                    loading={loading}
                                    error={Boolean(
                                        Object.keys(form.touched).length > 0 &&
                                            (errors.aliasPrefix || errors.aliasSuffix)
                                    )}
                                    actions={
                                        <Button
                                            shape="ghost"
                                            icon
                                            pill
                                            onClick={toggleShowAdvanced}
                                            title={c('Action').t`Show advanced options`}
                                        >
                                            <Icon name="cog-wheel" />
                                        </Button>
                                    }
                                >
                                    {`${aliasPrefix}${aliasSuffix?.value ?? ''}`}
                                </ValueControl>
                            </FieldsetCluster>

                            {customizeAliasDiscovery.open && (
                                <SpotlightGradient
                                    title={c('Title').t`Did you know?`}
                                    message={c('Info')
                                        .jt`Tap the icon ${gearIcon} to customize the alias the way you want.`}
                                    className="mb-2"
                                    onClose={customizeAliasDiscovery.close}
                                    withArrow
                                />
                            )}

                            <AliasForm
                                aliasOptions={aliasOptions.value}
                                loading={loading}
                                form={form}
                                showAdvanced={showAdvanced}
                            />

                            <FieldsetCluster>
                                <Field name="files" component={FileAttachmentsField} shareId={form.values.shareId} />
                            </FieldsetCluster>

                            <FieldsetCluster>
                                <Field
                                    name="note"
                                    label={c('Label').t`Note`}
                                    placeholder={c('Placeholder').t`Enter a note...`}
                                    component={TextAreaField}
                                    icon="note"
                                    maxLength={MAX_ITEM_NOTE_LENGTH}
                                    disabled={unverified}
                                />
                            </FieldsetCluster>
                        </Form>
                    </FormikProvider>
                </>
            )}
        </ItemCreatePanel>
    );
};

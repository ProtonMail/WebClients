import { type FC, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Icon, Option } from '@proton/components';
import { FeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useAliasDetails } from '@proton/pass/hooks/useAliasDetails';
import { useAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { deobfuscateExtraFields, obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { bindOTPSanitizer, formatDisplayNameWithEmail, sanitizeExtraField } from '@proton/pass/lib/items/item.utils';
import { createEditAliasFormValidator } from '@proton/pass/lib/validation/alias';
import { selectAliasDetails } from '@proton/pass/store/selectors';
import type { AliasMailbox, EditAliasFormValues } from '@proton/pass/types';
import { type MaybeNull } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

import { AliasSLNoteLabel } from './AliasSLNoteLabel';

const FORM_ID = 'edit-alias';

export const AliasEdit: FC<ItemEditViewProps<'alias'>> = ({ share, revision, onCancel, onSubmit }) => {
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, ...uneditable } = item;
    const aliasEmail = revision.aliasEmail!;

    /** To ensure proper sequencing in handling alias options and details. we use an awaiter.
     * If alias options or details are cached, the execution order of 'onAliasOptionsLoaded'
     * after the 'aliasOptions.request()' call cannot be guaranteed. The awaiter is employed to
     * ensure that the sequence is maintained correctly. */
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<EditAliasFormValues>>());
    const { current: aliasDetailsLoaded } = useRef(awaiter<void>());

    const [reconciled, setReconciled] = useState(false);
    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));
    const aliasOwner = aliasDetails?.modify ?? false;

    /* Keeping a ref to the alias details for composing the result
     * of `onAliasDetailsLoaded` with `onAliasOptionsLoading` effect */
    const mailboxesForAlias = useRef<AliasMailbox[]>([]);

    const note = useDeobfuscatedValue(metadata.note);
    const validateEditAliasForm = createEditAliasFormValidator(aliasOwner);

    const form = useFormik<EditAliasFormValues>({
        initialValues: {
            name: metadata.name,
            note,
            files: filesFormInitializer(),
            mailboxes: [],
            extraFields: deobfuscateExtraFields(item.extraFields),
            shareId,
            displayName: aliasDetails?.name ?? '',
            slNote: aliasDetails?.slNote ?? '',
        },
        onSubmit: ({ name, note, mailboxes, shareId, displayName, slNote, files, extraFields }) => {
            const sanitizeOTP = bindOTPSanitizer(aliasEmail, name);

            onSubmit({
                ...uneditable,
                extraData: { aliasOwner, mailboxes, aliasEmail, displayName, slNote },
                itemId,
                lastRevision,
                files,
                metadata: { ...metadata, name, note: obfuscate(note) },
                shareId,
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
            });
        },
        validate: validateEditAliasForm,
        validateOnChange: true,
        validateOnMount: true,
    });

    const emailSender = (
        <strong key="alias-edit-display-name">{formatDisplayNameWithEmail(form.values.displayName, aliasEmail)}</strong>
    );

    const aliasOptions = useAliasOptions({
        shareId,
        lazy: true,
        onAliasOptions: async (res) => {
            try {
                await aliasDetailsLoaded;
                if (!res.ok) return;

                const { mailboxes } = res.aliasOptions;
                const draft = await draftHydrated;
                const formValues = draft ?? form.values;
                const prevMailboxes = draft?.mailboxes ?? mailboxesForAlias.current;
                const sanitizedMailboxes = mailboxes.filter((mailbox) =>
                    prevMailboxes.some(({ id }) => id === mailbox.id)
                );

                const values = { ...formValues, mailboxes: sanitizedMailboxes };
                const errors = validateEditAliasForm(values);

                if (draft) {
                    await form.setValues(values);
                    form.setErrors(errors);
                } else form.resetForm({ values, errors });
            } finally {
                setReconciled(true);
            }
        },
    });

    const aliasDetailsMailboxes = useAliasDetails({
        aliasEmail,
        itemId,
        shareId,
        onAliasMailboxes: (res) => {
            mailboxesForAlias.current = res.ok ? res.mailboxes : [];
            aliasOptions.request();
            aliasDetailsLoaded.resolve();
        },
    });

    const mailboxes = aliasOptions.value?.mailboxes ?? [];
    const disabledMailboxes = !aliasOptions;

    useItemDraft<EditAliasFormValues>(form, {
        mode: 'edit',
        itemId: itemId,
        shareId,
        revision: lastRevision,
        onHydrated: draftHydrated.resolve,
    });

    /* check for length in case request gets revalidated in the background */
    const detailsLoading = aliasDetailsMailboxes.loading && aliasDetailsMailboxes.mailboxes.length === 0;
    const optionsLoading = aliasOptions.loading;
    const loading = !reconciled || detailsLoading || optionsLoading;

    const { isValid, dirty, status } = form;
    const valid = !(aliasOwner && loading) && isValid && dirty && !status?.isBusy;

    return (
        <ItemEditPanel type="alias" formId={FORM_ID} valid={valid} discardable={!dirty} handleCancelClick={onCancel}>
            {() => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
                            <Field
                                lengthLimiters
                                name="name"
                                label={c('Label').t`Title`}
                                placeholder={c('Label').t`Untitled`}
                                component={TitleField}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                                disabled={loading}
                            />
                        </FieldsetCluster>

                        <FieldsetCluster mode="read" as="div">
                            <ValueControl icon="alias" label={c('Label').t`Alias address`}>
                                {aliasEmail}
                            </ValueControl>

                            {aliasOwner ? (
                                <Field
                                    name="mailboxes"
                                    label={c('Label').t`Forwards to`}
                                    placeholder={c('Label').t`Select an email address`}
                                    component={SelectField}
                                    icon="arrow-up-and-right-big"
                                    multiple
                                    disabled={disabledMailboxes}
                                    loading={loading}
                                >
                                    {mailboxes.map((mailbox) => (
                                        <Option value={mailbox} title={mailbox.email} key={mailbox.id}>
                                            {mailbox.email}
                                        </Option>
                                    ))}
                                </Field>
                            ) : (
                                <ValueControl
                                    icon="arrow-up-and-right-big"
                                    label={c('Label').t`Forwards to`}
                                    loading={loading}
                                >
                                    {!loading ? (
                                        <span className="mt-1 text-xs color-weak flex items-center gap-1">
                                            <Icon name="exclamation-circle" size={4} />
                                            <span className="text-pre-wrap flex-1">{c('Info')
                                                .t`You cannot change the mailboxes for this alias.`}</span>
                                        </span>
                                    ) : undefined}
                                </ValueControl>
                            )}
                        </FieldsetCluster>

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

                        <FieldsetCluster>
                            <Field
                                name="files"
                                component={FileAttachmentsFieldEdit}
                                shareId={shareId}
                                itemId={itemId}
                                revision={lastRevision}
                            />
                        </FieldsetCluster>

                        {aliasOwner && (
                            <>
                                {aliasDetails?.slNote && (
                                    <FieldsetCluster>
                                        <Field
                                            name="slNote"
                                            label={<AliasSLNoteLabel />}
                                            placeholder={c('Placeholder').t`Note from SimpleLogin`}
                                            component={TextAreaField}
                                            icon="note"
                                            maxLength={MAX_ITEM_NOTE_LENGTH}
                                        />
                                    </FieldsetCluster>
                                )}

                                <FieldsetCluster>
                                    <Field
                                        name="displayName"
                                        label={c('Label').t`Display name`}
                                        placeholder={c('Placeholder').t`Name displayed in emails`}
                                        component={TextField}
                                        icon="card-identity"
                                        maxLength={MAX_ITEM_NAME_LENGTH}
                                    />
                                </FieldsetCluster>

                                {form.values.displayName && (
                                    <span className="color-weak mt-2">{c('Info')
                                        .jt`When sending an email from this alias, the email will display ${emailSender} as sender.`}</span>
                                )}

                                <FeatureFlag feature={PassFeature.PassCustomTypeV1}>
                                    <ExtraFieldGroup form={form} />
                                </FeatureFlag>
                            </>
                        )}
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};

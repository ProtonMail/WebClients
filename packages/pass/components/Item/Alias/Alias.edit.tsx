import { type VFC, useRef, useState } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Icon, Option } from '@proton/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { SelectField } from '@proton/pass/components/Form/Field/SelectField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useAliasDetails } from '@proton/pass/hooks/useAliasDetails';
import { useAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { useDeobfuscatedValue } from '@proton/pass/hooks/useDeobfuscatedValue';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import { createEditAliasFormValidator } from '@proton/pass/lib/validation/alias';
import type { AliasMailbox, EditAliasFormValues } from '@proton/pass/types';
import { type MaybeNull } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

const FORM_ID = 'edit-alias';

export const AliasEdit: VFC<ItemEditViewProps<'alias'>> = ({ vault, revision, onCancel, onSubmit }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const aliasEmail = revision.aliasEmail!;
    const { metadata, ...uneditable } = item;
    const { name, itemUuid } = metadata;

    const { current: draftHydrated } = useRef(awaiter<MaybeNull<EditAliasFormValues>>());

    /* If vault is not shared, we can safely assume the user is
     * the owner of the alias and can edit the mailboxes */
    const [aliasOwner, setAliasOwner] = useState(!vault.shared);

    /* Keeping a ref to the alias details for composing the result
     * of `onAliasDetailsLoaded` with `onAliasOptionsLoading` effect */
    const mailboxesForAlias = useRef<AliasMailbox[]>([]);

    const note = useDeobfuscatedValue(metadata.note);
    const initialValues: EditAliasFormValues = { name, note, mailboxes: [] };
    const validateEditAliasForm = createEditAliasFormValidator(aliasOwner);

    const form = useFormik<EditAliasFormValues>({
        initialValues,
        initialErrors: validateEditAliasForm(initialValues),
        onSubmit: ({ name, note, mailboxes }) => {
            onSubmit({
                ...uneditable,
                shareId: vault.shareId,
                itemId,
                lastRevision,
                metadata: {
                    name,
                    note: obfuscate(note),
                    itemUuid,
                },
                extraData: {
                    aliasOwner,
                    mailboxes,
                    aliasEmail: aliasEmail!,
                },
            });
        },
        validate: validateEditAliasForm,
        validateOnChange: true,
    });

    const aliasOptions = useAliasOptions({
        shareId: vault.shareId,
        lazy: true,
        onAliasOptionsLoaded: async ({ mailboxes }) => {
            const draft = await draftHydrated;
            const formValues = draft ?? form.values;
            const prevMailboxes = draft?.mailboxes ?? mailboxesForAlias.current;
            const sanitizedMailboxes = mailboxes.filter((mailbox) => prevMailboxes.some(({ id }) => id === mailbox.id));

            /* if the mailboxes do not match the user's alias options and the
             * vault is shared, then the user cannot manage its mailboxes */
            if (vault.shared) setAliasOwner(sanitizedMailboxes.length > 0);

            const values = { ...formValues, mailboxes: sanitizedMailboxes };
            const errors = validateEditAliasForm(values);

            if (draft) {
                await form.setValues(values);
                form.setErrors(errors);
            } else form.resetForm({ values, errors });
        },
    });

    const aliasDetails = useAliasDetails({
        aliasEmail,
        itemId,
        shareId,
        onAliasDetailsLoaded: (mailboxes) => {
            mailboxesForAlias.current = mailboxes ?? [];
            aliasOptions.request();
        },
    });

    const mailboxes = aliasOptions.value?.mailboxes ?? [];
    const disabledMailboxes = aliasOptions.loading || !aliasOptions;

    useItemDraft<EditAliasFormValues>(form, {
        mode: 'edit',
        itemId: itemId,
        shareId: vault.shareId,
        revision: lastRevision,
        onHydrated: draftHydrated.resolve,
    });

    const loading = (aliasDetails.loading && aliasDetails.value.length === 0) || aliasOptions.loading;

    return (
        <ItemEditPanel
            type="alias"
            formId={FORM_ID}
            valid={!(aliasOwner && loading) && form.isValid && form.dirty}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
        >
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
                                            <Icon name="exclamation-circle" size={16} />
                                            <span className="text-pre-wrap flex-item-fluid">{c('Info')
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
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};

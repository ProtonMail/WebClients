import { type FC, useRef, useState } from 'react';

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

export const AliasEdit: FC<ItemEditViewProps<'alias'>> = ({ vault, revision, onCancel, onSubmit }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const { metadata, ...uneditable } = item;
    const aliasEmail = revision.aliasEmail!;

    /** To ensure proper sequencing in handling alias options and details. we use an awaiter.
     * If alias options or details are cached, the execution order of 'onAliasOptionsLoaded'
     * after the 'aliasOptions.request()' call cannot be guaranteed. The awaiter is employed to
     * ensure that the sequence is maintained correctly. */
    const { current: draftHydrated } = useRef(awaiter<MaybeNull<EditAliasFormValues>>());
    const { current: aliasDetailsLoaded } = useRef(awaiter<void>());
    const reconciled = useRef(false);

    /* If vault is not shared, we can safely assume the user is
     * the owner of the alias and can edit the mailboxes */
    const [aliasOwner, setAliasOwner] = useState(!vault.shared);

    /* Keeping a ref to the alias details for composing the result
     * of `onAliasDetailsLoaded` with `onAliasOptionsLoading` effect */
    const mailboxesForAlias = useRef<AliasMailbox[]>([]);

    const note = useDeobfuscatedValue(metadata.note);
    const validateEditAliasForm = createEditAliasFormValidator(aliasOwner);

    const form = useFormik<EditAliasFormValues>({
        initialValues: { name: metadata.name, note, mailboxes: [], shareId: vault.shareId },
        onSubmit: ({ name, note, mailboxes, shareId }) => {
            onSubmit({
                ...uneditable,
                extraData: { aliasOwner, mailboxes, aliasEmail },
                itemId,
                lastRevision,
                metadata: { ...metadata, name, note: obfuscate(note) },
                shareId,
            });
        },
        validate: validateEditAliasForm,
        validateOnChange: true,
        validateOnMount: true,
    });

    const aliasOptions = useAliasOptions({
        shareId: vault.shareId,
        lazy: true,
        onAliasOptionsLoaded: async ({ mailboxes }) => {
            await aliasDetailsLoaded;

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

            reconciled.current = true;
        },
    });

    const aliasDetailsMailboxes = useAliasDetails({
        aliasEmail,
        itemId,
        shareId,
        onAliasMailboxesLoaded: (mailboxes) => {
            mailboxesForAlias.current = mailboxes ?? [];
            aliasOptions.request();
            aliasDetailsLoaded.resolve();
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

    /* check for length in case request gets revalidated in the background */
    const detailsLoading = aliasDetailsMailboxes.loading && aliasDetailsMailboxes.mailboxes.length === 0;
    const optionsLoading = aliasOptions.loading;
    const loading = !reconciled.current || detailsLoading || optionsLoading;

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
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};

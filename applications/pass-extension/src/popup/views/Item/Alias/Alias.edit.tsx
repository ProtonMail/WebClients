import { type VFC, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Option } from '@proton/components';
import { selectMailboxesForAlias } from '@proton/pass/store';
import type { MaybeNull } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';

import type { EditAliasFormValues } from '../../../../shared/form/types';
import { validateEditAliasForm } from '../../../../shared/form/validator/validate-alias';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import { useAliasOptions } from '../../../../shared/hooks';
import { type ItemEditProps } from '../../../../shared/items';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { SelectField } from '../../../components/Field/SelectField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { useDraftSync } from '../../../hooks/useItemDraft';

const FORM_ID = 'edit-alias';

export const AliasEdit: VFC<ItemEditProps<'alias'>> = ({ vault, revision, onCancel, onSubmit }) => {
    const { data: item, itemId, aliasEmail, revision: lastRevision } = revision;
    const { metadata, ...uneditable } = item;
    const { name, note, itemUuid } = metadata;

    const { current: draftHydrated } = useRef(awaiter<MaybeNull<EditAliasFormValues>>());

    const mailboxesForAlias = useSelector(selectMailboxesForAlias(aliasEmail!));
    const initialValues: EditAliasFormValues = { name, note, mailboxes: [] };

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
                    note,
                    itemUuid,
                },
                extraData: {
                    mailboxes,
                    aliasEmail: aliasEmail!,
                },
            });
        },
        validate: validateEditAliasForm,
        validateOnChange: true,
    });

    const { aliasOptions, aliasOptionsLoading } = useAliasOptions({
        shareId: vault.shareId,
        onAliasOptionsLoaded: async ({ mailboxes }) => {
            const draft = await draftHydrated;
            const formValues = draft ?? form.values;
            const sanitizedMailboxes = mailboxes.filter((mailbox) =>
                (draft?.mailboxes ?? mailboxesForAlias ?? []).some(({ email }) => email === mailbox.email)
            );

            const values = { ...formValues, mailboxes: sanitizedMailboxes };
            const errors = validateEditAliasForm(values);

            if (draft) {
                await form.setValues(values);
                form.setErrors(errors);
            } else form.resetForm({ values, errors });
        },
    });

    useDraftSync<EditAliasFormValues>(form, {
        type: 'alias',
        mode: 'edit',
        itemId: itemId,
        shareId: vault.shareId,
        onHydrated: draftHydrated.resolve,
    });

    return (
        <ItemEditPanel
            type="alias"
            formId={FORM_ID}
            valid={!aliasOptionsLoading && form.isValid && form.dirty}
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
                        </FieldsetCluster>

                        <FieldsetCluster>
                            <Field
                                name="mailboxes"
                                label={c('Label').t`Forwards to`}
                                placeholder={c('Label').t`Select an email address`}
                                component={SelectField}
                                icon="arrow-up-and-right-big"
                                multiple
                                disabled={aliasOptionsLoading || !aliasOptions || aliasOptions.mailboxes.length <= 1}
                                loading={aliasOptionsLoading}
                            >
                                {(aliasOptions?.mailboxes ?? []).map((mailbox) => (
                                    <Option value={mailbox} title={mailbox.email} key={mailbox.id}>
                                        {mailbox.email}
                                    </Option>
                                ))}
                            </Field>
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

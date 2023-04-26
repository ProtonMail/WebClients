import { type VFC, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Option } from '@proton/components';
import { selectMailboxesForAlias } from '@proton/pass/store';
import { merge } from '@proton/pass/utils/object';

import { useAliasOptions } from '../../../../shared/hooks';
import { type ItemEditProps } from '../../../../shared/items';
import { ValueControl } from '../../../components/Field/Control/ValueControl';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { SelectField } from '../../../components/Field/SelectField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../Item/Item.validation';
import { type EditAliasFormValues, validateEditAliasForm } from './Alias.validation';

const FORM_ID = 'edit-alias';

export const AliasEdit: VFC<ItemEditProps<'alias'>> = ({ vault, revision, onCancel, onSubmit }) => {
    const { data: item, itemId, aliasEmail, revision: lastRevision } = revision;
    const { metadata, ...uneditable } = item;
    const { name, note, itemUuid } = metadata;

    const [ready, setReady] = useState(false);

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
        onAliasOptionsLoaded: ({ mailboxes }) => {
            const values = merge(form.values, {
                mailboxes: mailboxes.filter((mailbox) =>
                    mailboxesForAlias?.some(({ email }) => email === mailbox.email)
                ),
            });

            form.resetForm({ errors: validateEditAliasForm(values), values });
            setReady(true);
        },
    });

    return (
        <ItemEditPanel
            type="alias"
            formId={FORM_ID}
            valid={ready && form.isValid && form.dirty}
            discardable={!form.dirty}
            handleCancelClick={onCancel}
        >
            {() => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
                            <Field
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

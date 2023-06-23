import { type VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import type { ItemEditProps } from '../../../../shared/items';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { type CreditCardItemFormValues, validateCreditCardForm } from './CreditCard.validation';

const FORM_ID = 'edit-creditCard';

export const CreditCardEdit: VFC<ItemEditProps<'creditCard'>> = ({ revision, onCancel }) => {
    const { data: item } = revision;
    const {
        metadata: { name, note },
    } = item;

    const initialValues: CreditCardItemFormValues = {
        name,
        note,
    };

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: () => {},
        validate: validateCreditCardForm,
        validateOnChange: true,
    });

    return (
        <ItemEditPanel
            type="creditCard"
            formId={FORM_ID}
            valid={form.isValid && form.dirty}
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
                                component={TitleField}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                            />
                        </FieldsetCluster>

                        <FieldsetCluster>
                            <Field
                                name="note"
                                label={c('Label').t`Note`}
                                placeholder={c('Placeholder').t`Add note`}
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

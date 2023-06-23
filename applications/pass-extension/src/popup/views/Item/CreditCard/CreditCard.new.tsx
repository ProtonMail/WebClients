import { type VFC, useMemo } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import type { ItemNewProps } from '../../../../shared/items';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { ItemCreatePanel } from '../../../components/Panel/ItemCreatePanel';
import { type CreditCardItemFormValues, validateCreditCardForm } from './CreditCard.validation';

const FORM_ID = 'new-creditCard';

export const CreditCardNew: VFC<ItemNewProps<'creditCard'>> = ({ onCancel }) => {
    const initialValues: CreditCardItemFormValues = useMemo(() => {
        return {
            name: '',
            note: '',
        };
    }, []);

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: () => {},
        validate: validateCreditCardForm,
        validateOnBlur: true,
    });

    return (
        <ItemCreatePanel
            type="creditCard"
            formId={FORM_ID}
            valid={form.isValid}
            handleCancelClick={onCancel}
            discardable={!form.dirty}
        >
            {({ didMount }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <FieldsetCluster>
                            <Field
                                name="name"
                                label={c('Label').t`Title`}
                                placeholder={c('Placeholder').t`Untitled`}
                                component={TitleField}
                                autoFocus={didMount}
                                key={`creditCard-name-${didMount}`}
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
        </ItemCreatePanel>
    );
};

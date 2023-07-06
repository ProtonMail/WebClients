import { type VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { CardType } from '@proton/pass/types/protobuf/item-v1';

import {
    type CreditCardItemFormValues,
    validateCreditCardForm,
} from '../../../../shared/form/validator/validate-creditCard';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import type { ItemEditProps } from '../../../../shared/items';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { MaskedTextField } from '../../../components/Field/MaskedTextField';
import { TextField } from '../../../components/Field/TextField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { cardNumberHiddenValue, cardNumberMask, expDateMask } from '../../../components/Field/masks/credit-card';
import { ItemEditPanel } from '../../../components/Panel/ItemEditPanel';
import { useDraftSync } from '../../../hooks/useItemDraft';

const FORM_ID = 'edit-creditCard';

export const CreditCardEdit: VFC<ItemEditProps<'creditCard'>> = ({ vault, revision, onSubmit, onCancel }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;
    const {
        metadata: { name, note, itemUuid },
        content,
    } = item;

    const initialValues: CreditCardItemFormValues = {
        shareId,
        name,
        note,
        ...content,
    };

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: ({ name, note, ...creditCardValues }) => {
            onSubmit({
                type: 'creditCard',
                shareId,
                itemId,
                lastRevision,
                metadata: { name, note, itemUuid },
                content: {
                    ...creditCardValues,
                    cardType: CardType.Unspecified,
                },
                extraData: {},
                extraFields: [],
            });
        },
        validate: validateCreditCardForm,
        validateOnChange: true,
    });

    useDraftSync<CreditCardItemFormValues>(form, {
        type: 'creditCard',
        mode: 'edit',
        shareId: form.values.shareId,
        itemId,
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
                                lengthLimiters
                                name="name"
                                label={c('Label').t`Title`}
                                component={TitleField}
                                maxLength={MAX_ITEM_NAME_LENGTH}
                            />
                        </FieldsetCluster>

                        <FieldsetCluster>
                            <Field
                                name="cardholderName"
                                component={TextField}
                                icon="user"
                                label={c('Label').t`Cardholder name`}
                                placeholder={c('Placeholder').t`Full Name`}
                            />
                            <Field
                                hidden
                                name="number"
                                component={MaskedTextField}
                                hiddenValue={cardNumberHiddenValue(form.values.number)}
                                icon="credit-card"
                                label={c('Label').t`Card number`}
                                mask={cardNumberMask(form.values.number)}
                                placeholder="1234 1234 1234 1234"
                            />
                            <Field
                                name="expirationDate"
                                component={MaskedTextField}
                                icon="calendar-today"
                                label={c('Label').t`Expires on`}
                                mask={expDateMask}
                                placeholder={c('Placeholder').t`MM/YYYY`}
                            />
                            <Field
                                hidden
                                name="verificationNumber"
                                component={MaskedTextField}
                                hiddenValue="••••"
                                icon="credit-card"
                                label={c('Label').t`Verification number`}
                                mask={{ mask: '0000' }}
                                placeholder="123"
                            />
                            <Field
                                hidden
                                name="pin"
                                component={MaskedTextField}
                                hiddenValue="••••"
                                icon="grid-3"
                                label={c('Label').t`PIN`}
                                mask={{ mask: '000000000000' }}
                                placeholder="1234"
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

import { type VFC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { MaskedTextField } from '@proton/pass/components/Form/Field/MaskedTextField';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { TextAreaField } from '@proton/pass/components/Form/Field/TextareaField';
import { TitleField } from '@proton/pass/components/Form/Field/TitleField';
import {
    cardNumberHiddenValue,
    cardNumberMask,
    expDateMask,
} from '@proton/pass/components/Form/Field/masks/credit-card';
import { ItemEditPanel } from '@proton/pass/components/Layout/Panel/ItemEditPanel';
import type { ItemEditViewProps } from '@proton/pass/components/Views/types';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '@proton/pass/constants';
import { useDeobfuscatedItem } from '@proton/pass/hooks/useDeobfuscatedItem';
import { useItemDraft } from '@proton/pass/hooks/useItemDraft';
import type { CreditCardItemFormValues } from '@proton/pass/lib/validation/credit-card';
import { validateCreditCardForm } from '@proton/pass/lib/validation/credit-card';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

const FORM_ID = 'edit-creditCard';

export const CreditCardEdit: VFC<ItemEditViewProps<'creditCard'>> = ({ vault, revision, onSubmit, onCancel }) => {
    const { shareId } = vault;
    const { data: item, itemId, revision: lastRevision } = revision;

    const {
        metadata: { name, note, itemUuid },
        content,
    } = useDeobfuscatedItem(item);

    const initialValues: CreditCardItemFormValues = { ...content, shareId, name, note };

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: ({ name, note, ...creditCardValues }) => {
            onSubmit({
                type: 'creditCard',
                shareId,
                itemId,
                lastRevision,
                metadata: { name, note: obfuscate(note), itemUuid },
                content: {
                    ...creditCardValues,
                    cardType: CardType.Unspecified,
                    number: obfuscate(creditCardValues.number),
                    verificationNumber: obfuscate(creditCardValues.verificationNumber),
                    pin: obfuscate(creditCardValues.pin),
                },
                extraData: {},
                extraFields: [],
            });
        },
        validate: validateCreditCardForm,
        validateOnChange: true,
    });

    useItemDraft<CreditCardItemFormValues>(form, {
        mode: 'edit',
        shareId: form.values.shareId,
        itemId,
        revision: lastRevision,
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
                                label={c('Label').t`Name on card`}
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
                                label={c('Label').t`Expiration date`}
                                mask={expDateMask}
                                placeholder={c('Placeholder').t`MM/YYYY`}
                            />
                            <Field
                                hidden
                                name="verificationNumber"
                                component={MaskedTextField}
                                hiddenValue="••••"
                                icon="credit-card"
                                label={c('Label').t`Security code`}
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

import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { selectVaultLimits } from '@proton/pass/store';
import { CardType } from '@proton/pass/types/protobuf/item-v1';
import { uniqueId } from '@proton/pass/utils/string';
import { getEpoch } from '@proton/pass/utils/time';

import {
    type CreditCardItemFormValues,
    validateCreditCardForm,
} from '../../../../shared/form/validator/validate-creditCard';
import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH } from '../../../../shared/form/validator/validate-item';
import type { ItemNewProps } from '../../../../shared/items';
import { Field } from '../../../components/Field/Field';
import { FieldsetCluster } from '../../../components/Field/Layout/FieldsetCluster';
import { MaskedTextField } from '../../../components/Field/MaskedTextField';
import { TextField } from '../../../components/Field/TextField';
import { TextAreaField } from '../../../components/Field/TextareaField';
import { TitleField } from '../../../components/Field/TitleField';
import { VaultSelectField } from '../../../components/Field/VaultSelectField';
import { cardNumberHiddenValue, cardNumberMask, expDateMask } from '../../../components/Field/masks/credit-card';
import { ItemCreatePanel } from '../../../components/Panel/ItemCreatePanel';
import { useDraftSync } from '../../../hooks/useItemDraft';

const FORM_ID = 'new-creditCard';

export const CreditCardNew: VFC<ItemNewProps<'creditCard'>> = ({ shareId, onSubmit, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);

    const initialValues: CreditCardItemFormValues = useMemo(() => {
        return {
            shareId,
            name: '',
            cardholderName: '',
            number: '',
            expirationDate: '',
            verificationNumber: '',
            pin: '',
            note: '',
        };
    }, []);

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: ({ shareId, name, note, ...creditCardValues }) => {
            const id = uniqueId();
            onSubmit({
                type: 'creditCard',
                optimisticId: id,
                shareId,
                createTime: getEpoch(),
                metadata: { name, note, itemUuid: id },
                content: {
                    ...creditCardValues,
                    cardType: CardType.Unspecified,
                },
                extraData: {},
                extraFields: [],
            });
        },
        validate: validateCreditCardForm,
        validateOnBlur: true,
    });

    useDraftSync<CreditCardItemFormValues>(form, {
        type: 'creditCard',
        mode: 'new',
        shareId: form.values.shareId,
        itemId: 'draft-cc',
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
                            {vaultTotalCount > 1 && (
                                <Field component={VaultSelectField} label={c('Label').t`Vault`} name="shareId" />
                            )}
                            <Field
                                lengthLimiters
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
        </ItemCreatePanel>
    );
};

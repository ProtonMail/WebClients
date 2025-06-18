import { type FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { FeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { FileAttachmentsFieldEdit } from '@proton/pass/components/FileAttachments/FileAttachmentsFieldEdit';
import { ExtraFieldGroup } from '@proton/pass/components/Form/Field/ExtraFieldGroup/ExtraFieldGroup';
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
import { filesFormInitializer } from '@proton/pass/lib/file-attachments/helpers';
import { obfuscateExtraFields } from '@proton/pass/lib/items/item.obfuscation';
import { bindOTPSanitizer, sanitizeExtraField } from '@proton/pass/lib/items/item.utils';
import { formatExpirationDateMMYY, validateCreditCardForm } from '@proton/pass/lib/validation/credit-card';
import type { CreditCardItemFormValues } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { CardType } from '@proton/pass/types/protobuf/item-v1.static';
import { obfuscate } from '@proton/pass/utils/obfuscate/xor';

const FORM_ID = 'edit-creditCard';

export const CreditCardEdit: FC<ItemEditViewProps<'creditCard'>> = ({ share, revision, onSubmit, onCancel }) => {
    const { shareId } = share;
    const { data: item, itemId, revision: lastRevision } = revision;

    const { metadata, content, extraFields, ...uneditable } = useDeobfuscatedItem(item);

    const form = useFormik<CreditCardItemFormValues>({
        initialValues: {
            ...content,
            expirationDate: formatExpirationDateMMYY(content.expirationDate),
            name: metadata.name,
            note: metadata.note,
            files: filesFormInitializer(),
            shareId,
            extraFields,
        },
        onSubmit: ({ name, note, files, extraFields, ...creditCardValues }) => {
            const sanitizeOTP = bindOTPSanitizer(name);

            onSubmit({
                ...uneditable,
                files,
                content: {
                    ...creditCardValues,
                    cardType: CardType.Unspecified,
                    expirationDate: creditCardValues.expirationDate,
                    number: obfuscate(creditCardValues.number),
                    pin: obfuscate(creditCardValues.pin),
                    verificationNumber: obfuscate(creditCardValues.verificationNumber),
                },
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
                itemId,
                lastRevision,
                metadata: { ...metadata, name, note: obfuscate(note) },
                shareId,
            });
        },
        validate: validateCreditCardForm,
        validateOnChange: true,
        validateOnMount: true,
    });

    useItemDraft<CreditCardItemFormValues>(form, {
        mode: 'edit',
        itemId,
        revision: lastRevision,
        shareId: form.values.shareId,
    });

    return (
        <ItemEditPanel
            type="creditCard"
            formId={FORM_ID}
            valid={form.isValid && form.dirty && !form.status?.isBusy}
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
                                placeholder={c('Placeholder').t`MM/YY`}
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

                        <FieldsetCluster>
                            <Field
                                name="files"
                                component={FileAttachmentsFieldEdit}
                                shareId={shareId}
                                itemId={itemId}
                                revision={lastRevision}
                            />
                        </FieldsetCluster>

                        <FeatureFlag feature={PassFeature.PassCustomTypeV1}>
                            <ExtraFieldGroup form={form} />
                        </FeatureFlag>
                    </Form>
                </FormikProvider>
            )}
        </ItemEditPanel>
    );
};

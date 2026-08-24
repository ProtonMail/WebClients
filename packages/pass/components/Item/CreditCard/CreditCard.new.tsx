import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { MAX_ITEM_NAME_LENGTH, MAX_ITEM_NOTE_LENGTH, UpsellRef } from '../../../constants';
import { useInitialValues } from '../../../hooks/items/useInitialValues';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { useItemDraft } from '../../../hooks/useItemDraft';
import { usePortal } from '../../../hooks/usePortal';
import { filesFormInitializer } from '../../../lib/file-attachments/helpers';
import { obfuscateExtraFields } from '../../../lib/items/item.obfuscation';
import { bindOTPSanitizer, sanitizeExtraField } from '../../../lib/items/item.utils';
import { validateCreditCardForm } from '../../../lib/validation/credit-card';
import { selectPassPlan, selectVaultLimits } from '../../../store/selectors';
import type { CreditCardItemFormValues } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { UserPassPlan } from '../../../types/api/plan';
import { obfuscate } from '../../../utils/obfuscate/xor';
import { uniqueId } from '../../../utils/string/unique-id';
import { formatExpirationDateMMYY } from '../../../utils/time/expiration-date';
import { FeatureFlag } from '../../Core/WithFeatureFlag';
import { FileAttachmentsField } from '../../FileAttachments/FileAttachmentsField';
import { ExtraFieldGroup } from '../../Form/Field/ExtraFieldGroup/ExtraFieldGroup';
import { Field } from '../../Form/Field/Field';
import { FieldsetCluster } from '../../Form/Field/Layout/FieldsetCluster';
import { MaskedTextField } from '../../Form/Field/MaskedTextField';
import { TextField } from '../../Form/Field/TextField';
import { TextAreaField } from '../../Form/Field/TextareaField';
import { TitleField } from '../../Form/Field/TitleField';
import { VaultPickerField } from '../../Form/Field/VaultPickerField';
import { cardNumberHiddenValue, cardNumberMask, expDateMask } from '../../Form/Field/masks/credit-card';
import { Card } from '../../Layout/Card/Card';
import { ItemCreatePanel } from '../../Layout/Panel/ItemCreatePanel';
import { UpgradeButton } from '../../Upsell/UpgradeButton';
import type { ItemNewViewProps } from '../../Views/types';
import { getCreditCardType } from './CreditCard.utils';

const FORM_ID = 'new-creditCard';

export const CreditCardNew: FC<ItemNewViewProps<'creditCard'>> = ({ shareId, onSubmit, onCancel }) => {
    const { vaultTotalCount } = useSelector(selectVaultLimits);
    const { ParentPortal, openPortal } = usePortal();

    const initialValues = useInitialValues<CreditCardItemFormValues>((options) => {
        const clone = options?.clone.type === 'creditCard' ? options.clone : null;

        return {
            cardholderName: clone?.content.cardholderName ?? '',
            expirationDate: clone?.content.expirationDate ? formatExpirationDateMMYY(clone.content.expirationDate) : '',
            extraFields: options?.clone.extraFields ?? [],
            files: filesFormInitializer(),
            name: clone?.metadata.name ?? '',
            note: clone?.metadata.note ?? '',
            number: clone?.content.number ?? '',
            pin: clone?.content.pin ?? '',
            shareId: options?.shareId ?? shareId,
            verificationNumber: clone?.content.verificationNumber ?? '',
        };
    });

    const form = useFormik<CreditCardItemFormValues>({
        initialValues,
        initialErrors: validateCreditCardForm(initialValues),
        onSubmit: async ({ shareId, name, note, files, extraFields, ...creditCardValues }) => {
            const id = uniqueId();
            const sanitizeOTP = bindOTPSanitizer(name);

            onSubmit({
                type: 'creditCard',
                optimisticId: id,
                shareId,
                metadata: { name, note: obfuscate(note), itemUuid: id },
                files,
                content: {
                    ...creditCardValues,
                    cardType: await getCreditCardType(creditCardValues.number),
                    number: obfuscate(creditCardValues.number),
                    verificationNumber: obfuscate(creditCardValues.verificationNumber),
                    pin: obfuscate(creditCardValues.pin),
                },
                extraFields: obfuscateExtraFields(extraFields.map(sanitizeExtraField(sanitizeOTP))),
            });
        },
        validate: validateCreditCardForm,
        validateOnBlur: true,
    });

    useItemDraft<CreditCardItemFormValues>(form, { mode: 'new', type: 'creditCard' });
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const freeCcFlag = useFeatureFlag(PassFeature.PassAllowCreditCardFreeUsers);
    const upsell = !freeCcFlag && isFreePlan;

    return (
        <ItemCreatePanel
            discardable={!form.dirty}
            formId={FORM_ID}
            handleCancelClick={onCancel}
            submitButton={upsell && <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_CC} />}
            type="creditCard"
            valid={form.isValid && !form.status?.isBusy}
            actions={ParentPortal}
        >
            {({ didEnter }) => (
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        {upsell && (
                            <Card className="mb-2 text-sm" type="primary">
                                {c('Info')
                                    .t`You have reached the limit of credit cards you can create. Create an unlimited number of credit cards when you upgrade your subscription.`}
                            </Card>
                        )}

                        <FieldsetCluster>
                            {vaultTotalCount > 1 &&
                                openPortal(<Field component={VaultPickerField} name="shareId" dense />)}
                            <Field
                                lengthLimiters
                                name="name"
                                label={c('Label').t`Title`}
                                placeholder={c('Placeholder').t`Untitled`}
                                component={TitleField}
                                autoFocus={didEnter}
                                key={`creditCard-name-${didEnter}`}
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
                            <Field name="files" component={FileAttachmentsField} shareId={form.values.shareId} />
                        </FieldsetCluster>

                        <FeatureFlag feature={PassFeature.PassCustomTypeV1}>
                            <ExtraFieldGroup form={form} />
                        </FeatureFlag>
                    </Form>
                </FormikProvider>
            )}
        </ItemCreatePanel>
    );
};

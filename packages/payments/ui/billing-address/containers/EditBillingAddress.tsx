import { useState } from 'react';

import { c } from 'ttag';

import { changeBillingAddress } from '@proton/account';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalTwoPromiseHandlers } from '@proton/components/components/modalTwo/useModalTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { useFlag } from '@proton/unleash/useFlag';

import { type FullBillingAddress, zipCodeValidator } from '../../../core/billing-address/billing-address';
import type { BillingAddressValidationResult } from '../../../core/errors';
import { WrongBillingAddressError, backendBillingAddressFieldError } from '../../../core/errors';
import type { FreeSubscription, PaymentsApi } from '../../../core/interface';
import type { Subscription } from '../../../core/subscription/interface';
import { isFreeSubscription } from '../../../core/type-guards';
import { CountryStateSelector } from '../components/CountryStateSelector';
import { type CountriesWithCustomVatName, getVatNumberName } from '../components/VatNumberInput';
import { getVatFormErrors } from '../hooks/useVatFormValidation';

export interface EditBillingAdressModalInputs {
    initialFullBillingAddress: FullBillingAddress;
    paymentsApi?: PaymentsApi;
    subscription: Subscription | FreeSubscription | undefined;
}

type Props = ModalProps & ModalTwoPromiseHandlers<FullBillingAddress> & EditBillingAdressModalInputs;

function renewalPriceDependentOnVatNumber(countryCode: string): string {
    const texts: Record<CountriesWithCustomVatName, string> = {
        US: c('Payments.Renewal price dependent on VAT number')
            .t`Renewal price is dependent on the billing region and EIN.`,
        CA: c('Payments.Renewal price dependent on VAT number')
            .t`Renewal price is dependent on the billing region and Business Number.`,
        AU: c('Payments.Renewal price dependent on VAT number')
            .t`Renewal price is dependent on the billing region and ABN.`,
    };

    const stringTexts = texts as Record<string, string>;

    return (
        stringTexts[countryCode] ??
        c('Payments.Renewal price dependent on VAT number')
            .t`Renewal price is dependent on the billing region and VAT number.`
    );
}

export const EditBillingAddressModal = (props: Props) => {
    const {
        initialFullBillingAddress,
        onReject,
        onResolve,
        paymentsApi: paymentsApiParam,
        subscription,
        ...rest
    } = props;

    const { createNotification } = useNotifications();
    const [fullBillingAddress, setFullBillingAddress] = useState<FullBillingAddress>(initialFullBillingAddress);
    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const paymentsApi = paymentsApiParam ?? defaultPaymentsApi;

    const { validator, onFormSubmit } = useFormErrors();
    const dispatch = useDispatch();
    const showExtendedBillingAddressForm = useFlag('PaymentsValidateBillingAddress');

    const [loading, withLoading] = useLoading();
    const [backendErrors, setBackendErrors] = useState<BillingAddressValidationResult | null>(null);

    const frontendErrors = getVatFormErrors(
        {
            ...fullBillingAddress.BillingAddress,
            VatId: fullBillingAddress.VatId,
        },
        showExtendedBillingAddressForm
    );

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.stopPropagation();

        if (!onFormSubmit()) {
            return;
        }

        setBackendErrors(null);

        void withLoading(async () => {
            try {
                await paymentsApi.updateFullBillingAddress(fullBillingAddress);
                dispatch(
                    changeBillingAddress({
                        CountryCode: fullBillingAddress.BillingAddress.CountryCode,
                        State: fullBillingAddress.BillingAddress.State,
                        ZipCode: fullBillingAddress.BillingAddress.ZipCode,
                    })
                );

                onResolve?.(fullBillingAddress);
                createNotification({ text: c('Success').t`Billing details updated` });
            } catch (error: any) {
                if (error instanceof WrongBillingAddressError) {
                    if (error.validationResult) {
                        setBackendErrors(error.validationResult);
                    }
                    createNotification({ type: 'error', text: c('Error').t`Wrong billing address` });
                    return;
                }
            }
        });
    };

    const updateBillingAddress = (updater: Parameters<typeof setFullBillingAddress>[0]) => {
        setFullBillingAddress(updater);
        setBackendErrors(null);
    };

    const vatNumberName = getVatNumberName(fullBillingAddress.BillingAddress.CountryCode);

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} onClose={onReject} {...rest}>
            <ModalTwoHeader title={c('Title').t`Edit billing address`} />
            <ModalTwoContent>
                <p className="mb-4">
                    {c('Edit billing address form note')
                        .t`Text fields are optional. The information you provide in this form will only appear on invoices issued in the future and will not affect existing invoices.`}
                </p>
                {subscription && !isFreeSubscription(subscription) && (
                    <p className="mb-4">
                        {renewalPriceDependentOnVatNumber(fullBillingAddress.BillingAddress.CountryCode)}
                    </p>
                )}
                <div>
                    <div className="field-two-container">
                        <CountryStateSelector
                            selectedCountryCode={fullBillingAddress.BillingAddress.CountryCode}
                            setSelectedCountry={(CountryCode: string) => {
                                updateBillingAddress((model) => ({
                                    ...model,
                                    BillingAddress: {
                                        ...model.BillingAddress,
                                        CountryCode,
                                        State: null,
                                        ZipCode: null,
                                    },
                                }));
                            }}
                            setFederalState={(State: string) => {
                                updateBillingAddress((model) => ({
                                    ...model,
                                    BillingAddress: { ...model.BillingAddress, State, ZipCode: null },
                                }));
                            }}
                            federalStateCode={fullBillingAddress.BillingAddress.State ?? null}
                            fullsize={true}
                            validator={validator}
                        />
                    </div>
                    <InputFieldTwo
                        label={
                            fullBillingAddress.BillingAddress.CountryCode === 'US'
                                ? c('Label').t`ZIP code`
                                : c('Label').t`Postal code`
                        }
                        placeholder="12345"
                        name="zipcode"
                        data-testid="billing-address-zipcode"
                        value={fullBillingAddress.BillingAddress.ZipCode ?? ''}
                        onValue={(value: string) =>
                            updateBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, ZipCode: value },
                            }))
                        }
                        error={
                            validator([zipCodeValidator(fullBillingAddress.BillingAddress)]) ||
                            backendBillingAddressFieldError(backendErrors?.ZipCode)
                        }
                    />
                    <InputFieldTwo
                        label={vatNumberName}
                        placeholder={vatNumberName}
                        name="vat"
                        data-testid="billing-address-vat"
                        value={fullBillingAddress.VatId ?? ''}
                        onValue={(value: string) =>
                            updateBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, VatId: value },
                                VatId: value,
                            }))
                        }
                        error={
                            validator([frontendErrors.errorMessages.VatId]) ||
                            backendBillingAddressFieldError(backendErrors?.VatId)
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`Company`}
                        placeholder={c('Placeholder').t`Company name`}
                        name="company"
                        data-testid="billing-address-company"
                        value={fullBillingAddress.BillingAddress.Company ?? ''}
                        onValue={(value: string) =>
                            updateBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, Company: value },
                            }))
                        }
                        error={
                            validator([frontendErrors.errorMessages.Company]) ||
                            backendBillingAddressFieldError(backendErrors?.Company)
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`City`}
                        placeholder={c('Placeholder').t`Anytown`}
                        name="city"
                        data-testid="billing-address-city"
                        value={fullBillingAddress.BillingAddress.City ?? ''}
                        onValue={(value: string) =>
                            updateBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, City: value },
                            }))
                        }
                        error={
                            validator([frontendErrors.errorMessages.City]) ||
                            backendBillingAddressFieldError(backendErrors?.City)
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`Street address`}
                        placeholder={c('Placeholder').t`Main street 12`}
                        name="address"
                        data-testid="billing-address-address"
                        value={fullBillingAddress.BillingAddress.Address ?? ''}
                        onValue={(value: string) =>
                            updateBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, Address: value },
                            }))
                        }
                        error={
                            validator([frontendErrors.errorMessages.Address]) ||
                            backendBillingAddressFieldError(backendErrors?.Address)
                        }
                    />
                    <div className="flex gap-4">
                        <InputFieldTwo
                            label={c('Label').t`First name`}
                            placeholder={c('Placeholder').t`Thomas`}
                            name="firstname"
                            data-testid="billing-address-firstname"
                            value={fullBillingAddress.BillingAddress.FirstName ?? ''}
                            onValue={(value: string) =>
                                updateBillingAddress((model) => ({
                                    ...model,
                                    BillingAddress: { ...model.BillingAddress, FirstName: value },
                                }))
                            }
                            error={
                                validator([frontendErrors.errorMessages.FirstName]) ||
                                backendBillingAddressFieldError(backendErrors?.FirstName)
                            }
                            rootClassName="flex-1"
                        />
                        <InputFieldTwo
                            label={c('Label').t`Last name`}
                            placeholder={c('Placeholder').t`Anderson`}
                            name="lastname"
                            data-testid="billing-address-lastname"
                            value={fullBillingAddress.BillingAddress.LastName ?? ''}
                            onValue={(value: string) =>
                                updateBillingAddress((model) => ({
                                    ...model,
                                    BillingAddress: { ...model.BillingAddress, LastName: value },
                                }))
                            }
                            error={
                                validator([frontendErrors.errorMessages.LastName]) ||
                                backendBillingAddressFieldError(backendErrors?.LastName)
                            }
                            rootClassName="flex-1"
                        />
                    </div>
                </div>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading}>{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

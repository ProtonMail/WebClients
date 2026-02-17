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

import type { FullBillingAddress } from '../../../core/billing-address/billing-address';
import { isCountryWithRequiredPostalCode } from '../../../core/countries';
import type { PaymentsApi } from '../../../core/interface';
import { CountryStateSelector } from '../../components/CountryStateSelector';
import { getVatNumberName } from '../../components/VatNumberInput';

export interface EditBillingAdressModalInputs {
    initialFullBillingAddress: FullBillingAddress;
    paymentsApi?: PaymentsApi;
    focusVat?: boolean;
}

type Props = ModalProps & ModalTwoPromiseHandlers<FullBillingAddress> & EditBillingAdressModalInputs;

const zipCodeValidator = (countryCode: string, zipCode: string | null | undefined) => {
    if (isCountryWithRequiredPostalCode(countryCode) && !zipCode) {
        if (countryCode === 'US') {
            return c('Error').t`ZIP code is required`;
        }

        return c('Error').t`Postal code is required`;
    }

    return '';
};

export const EditBillingAddressModal = (props: Props) => {
    const { initialFullBillingAddress, focusVat, onReject, onResolve, paymentsApi: paymentsApiParam, ...rest } = props;

    const { createNotification } = useNotifications();
    const [fullBillingAddress, setFullBillingAddress] = useState<FullBillingAddress>(initialFullBillingAddress);
    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const paymentsApi = paymentsApiParam ?? defaultPaymentsApi;

    const { validator, onFormSubmit } = useFormErrors();
    const dispatch = useDispatch();

    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.stopPropagation();

        if (!onFormSubmit()) {
            return;
        }

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
            } catch {}
        });
    };

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} onClose={onReject} {...rest}>
            <ModalTwoHeader title={c('Title').t`Edit billing address`} />
            <ModalTwoContent>
                <p className="mb-4">
                    {c('Edit billing address form note')
                        .t`Text fields are optional. The information you provide in this form will only appear on invoices issued in the future and will not affect existing invoices.`}
                </p>
                <div>
                    <div className="field-two-container">
                        <CountryStateSelector
                            selectedCountryCode={fullBillingAddress.BillingAddress.CountryCode}
                            setSelectedCountry={(CountryCode: string) => {
                                setFullBillingAddress((model) => ({
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
                                setFullBillingAddress((model) => ({
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
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, ZipCode: value },
                            }))
                        }
                        error={validator([
                            zipCodeValidator(
                                fullBillingAddress.BillingAddress.CountryCode,
                                fullBillingAddress.BillingAddress.ZipCode
                            ),
                        ])}
                    />
                    <InputFieldTwo
                        label={c('Label').t`Company`}
                        placeholder={c('Placeholder').t`Company name`}
                        name="company"
                        data-testid="billing-address-company"
                        value={fullBillingAddress.BillingAddress.Company ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, Company: value },
                            }))
                        }
                    />
                    <InputFieldTwo
                        label={getVatNumberName(fullBillingAddress.BillingAddress.CountryCode)}
                        placeholder={c('Placeholder').t`VAT number`}
                        name="vat"
                        data-testid="billing-address-vat"
                        value={fullBillingAddress.VatId ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, VatId: value },
                                VatId: value,
                            }))
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`First name`}
                        placeholder={c('Placeholder').t`Thomas`}
                        name="firstname"
                        data-testid="billing-address-firstname"
                        value={fullBillingAddress.BillingAddress.FirstName ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, FirstName: value },
                            }))
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`Last name`}
                        placeholder={c('Placeholder').t`Anderson`}
                        name="lastname"
                        data-testid="billing-address-lastname"
                        value={fullBillingAddress.BillingAddress.LastName ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, LastName: value },
                            }))
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`Street address`}
                        placeholder={c('Placeholder').t`Main street 12`}
                        name="address"
                        data-testid="billing-address-address"
                        value={fullBillingAddress.BillingAddress.Address ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, Address: value },
                            }))
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`City`}
                        placeholder={c('Placeholder').t`Anytown`}
                        name="city"
                        data-testid="billing-address-city"
                        value={fullBillingAddress.BillingAddress.City ?? ''}
                        onValue={(value: string) =>
                            setFullBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, City: value },
                            }))
                        }
                    />
                </div>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading}>{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

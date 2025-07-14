import { useState } from 'react';

import { c } from 'ttag';

import { changeBillingAddress } from '@proton/account';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import {
    type FullBillingAddress,
    type Invoice,
    isCountryWithRequiredPostalCode,
    isCountryWithStates,
} from '@proton/payments';
import { CountryStateSelector } from '@proton/payments/ui';
import { useDispatch } from '@proton/redux-shared-store';

type EditExistingInvoiceProps = {
    editExistingInvoice: true;
    invoice: Invoice;
};

function isEditExistingInvoice(props: EditInvoiceProps): props is EditExistingInvoiceProps {
    return props.editExistingInvoice;
}

export type EditInvoiceProps =
    | {
          editExistingInvoice: false;
      }
    | EditExistingInvoiceProps;

type Props = ModalProps &
    EditInvoiceProps & {
        initialFullBillingAddress: FullBillingAddress;
    };

const zipCodeValidator = (countryCode: string, zipCode: string | null) => {
    if (isCountryWithRequiredPostalCode(countryCode) && !zipCode) {
        if (countryCode === 'US') {
            return c('Error').t`ZIP code is required`;
        }

        return c('Error').t`Postal code is required`;
    }

    return '';
};

const EditBillingAddressModal = ({ initialFullBillingAddress, ...props }: Props) => {
    const { createNotification } = useNotifications();
    const [fullBillingAddress, setFullBillingAddress] = useState<FullBillingAddress>(initialFullBillingAddress);
    const { paymentsApi } = usePaymentsApi();
    const { validator, onFormSubmit } = useFormErrors();
    const dispatch = useDispatch();

    const [loading, withLoading] = useLoading();

    const handleSubmit = async () => {
        if (isEditExistingInvoice(props)) {
            await paymentsApi.updateInvoiceBillingAddress(props.invoice.ID, fullBillingAddress);
        } else {
            await paymentsApi.updateFullBillingAddress(fullBillingAddress);
            dispatch(
                changeBillingAddress({ CountryCode: fullBillingAddress.CountryCode, State: fullBillingAddress.State })
            );
        }

        props.onClose?.();
        createNotification({ text: c('Success').t`Billing details updated` });
    };

    const showCountryAndState = !props.editExistingInvoice;
    const showPostalCode = !props.editExistingInvoice || !isCountryWithStates(fullBillingAddress.CountryCode);

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} {...props}>
            <ModalTwoHeader title={c('Title').t`Edit billing address`} />
            <ModalTwoContent>
                <p className="mb-4">
                    {props.editExistingInvoice
                        ? c('Edit billing address form note')
                              .t`Text fields are optional. The information you provide in this form will only change the invoice you have selected and not your future invoice details.`
                        : c('Edit billing address form note')
                              .t`Text fields are optional. The information you provide in this form will only appear on invoices issued in the future and will not affect existing invoices.`}
                </p>
                <form name="billing-address-form">
                    <InputFieldTwo
                        label={c('Label').t`Company`}
                        placeholder={c('Placeholder').t`Company name`}
                        autoFocus
                        name="company"
                        data-testid="billing-address-company"
                        value={fullBillingAddress.Company ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, Company: value }))}
                    />
                    <InputFieldTwo
                        label={c('Label').t`VAT identification number`}
                        placeholder={c('Placeholder').t`VAT number`}
                        autoFocus
                        name="vat"
                        data-testid="billing-address-vat"
                        value={fullBillingAddress.VatId ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, VatId: value }))}
                    />
                    <InputFieldTwo
                        label={c('Label').t`First name`}
                        placeholder={c('Placeholder').t`Thomas`}
                        name="firstname"
                        data-testid="billing-address-firstname"
                        value={fullBillingAddress.FirstName ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, FirstName: value }))}
                    />
                    <InputFieldTwo
                        label={c('Label').t`Last name`}
                        placeholder={c('Placeholder').t`Anderson`}
                        name="lastname"
                        data-testid="billing-address-lastname"
                        value={fullBillingAddress.LastName ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, LastName: value }))}
                    />
                    <InputFieldTwo
                        label={c('Label').t`Street address`}
                        placeholder={c('Placeholder').t`Main street 12`}
                        name="address"
                        data-testid="billing-address-address"
                        value={fullBillingAddress.Address ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, Address: value }))}
                    />
                    <InputFieldTwo
                        label={c('Label').t`City`}
                        placeholder={c('Placeholder').t`Anytown`}
                        name="city"
                        data-testid="billing-address-city"
                        value={fullBillingAddress.City ?? ''}
                        onValue={(value: string) => setFullBillingAddress((model) => ({ ...model, City: value }))}
                    />
                    {showPostalCode && (
                        <InputFieldTwo
                            label={
                                fullBillingAddress.CountryCode === 'US'
                                    ? c('Label').t`ZIP code`
                                    : c('Label').t`Postal code`
                            }
                            placeholder="12345"
                            name="zipcode"
                            data-testid="billing-address-zipcode"
                            value={fullBillingAddress.ZipCode ?? ''}
                            onValue={(value: string) =>
                                setFullBillingAddress((model) => ({ ...model, ZipCode: value }))
                            }
                            error={validator([
                                zipCodeValidator(fullBillingAddress.CountryCode, fullBillingAddress.ZipCode),
                            ])}
                        />
                    )}
                    {showCountryAndState && (
                        <div className="field-two-container">
                            <CountryStateSelector
                                selectedCountryCode={fullBillingAddress.CountryCode}
                                setSelectedCountry={(CountryCode: string) => {
                                    setFullBillingAddress((model) => ({
                                        ...model,
                                        CountryCode,
                                        State: null,
                                    }));
                                }}
                                setFederalState={(State: string) => {
                                    setFullBillingAddress((model) => ({ ...model, State }));
                                }}
                                federalStateCode={fullBillingAddress.State ?? null}
                                fullsize={true}
                                validator={validator}
                            />
                        </div>
                    )}
                </form>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="norm"
                    type="submit"
                    form="billing-address-form"
                    onClick={() => {
                        if (!onFormSubmit()) {
                            return;
                        }

                        void withLoading(handleSubmit());
                    }}
                    loading={loading}
                >{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EditBillingAddressModal;

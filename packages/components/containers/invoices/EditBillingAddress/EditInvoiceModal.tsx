import { useState } from 'react';

import { c } from 'ttag';

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
import { type FullBillingAddress, type Invoice, isCountryWithRequiredPostalCode } from '@proton/payments';
import { getVatNumberName } from '@proton/payments/ui';

export type EditInvoiceModalInputs = {
    initialFullBillingAddress: FullBillingAddress;
    initialInvoiceBillingAddress: FullBillingAddress;
    invoice: Invoice;
};

type Props = ModalProps & ModalTwoPromiseHandlers<void> & EditInvoiceModalInputs;

const zipCodeValidator = (countryCode: string, zipCode: string | null | undefined) => {
    if (isCountryWithRequiredPostalCode(countryCode) && !zipCode) {
        if (countryCode === 'US') {
            return c('Error').t`ZIP code is required`;
        }

        return c('Error').t`Postal code is required`;
    }

    return '';
};

export const EditInvoiceModal = (props: Props) => {
    const { initialInvoiceBillingAddress, initialFullBillingAddress, onReject, onResolve, ...rest } = props;

    const { createNotification } = useNotifications();
    const [invoiceBillingAddress, setInvoiceBillingAddress] =
        useState<FullBillingAddress>(initialInvoiceBillingAddress);
    const { paymentsApi } = usePaymentsApi();

    const { validator, onFormSubmit } = useFormErrors();

    const [loading, withLoading] = useLoading();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.stopPropagation();

        if (!onFormSubmit()) {
            return;
        }

        void withLoading(async () => {
            try {
                await paymentsApi.updateInvoiceBillingAddress(props.invoice.ID, invoiceBillingAddress);
                onResolve?.();
                createNotification({ text: c('Success').t`Billing details updated` });
            } catch {
                createNotification({ type: 'error', text: c('Error').t`Failed to update billing address` });
                return;
            }
        });
    };

    const hidePostalCode = isCountryWithRequiredPostalCode(invoiceBillingAddress.BillingAddress.CountryCode);
    const showPostalCode = !hidePostalCode;

    return (
        <ModalTwo as={Form} onSubmit={handleSubmit} onClose={onReject} {...rest}>
            <ModalTwoHeader title={c('Title').t`Edit billing address`} />
            <ModalTwoContent>
                <p className="mb-4">
                    {c('Edit billing address form note')
                        .t`Text fields are optional. The information you provide in this form will only change the invoice you have selected and not your future invoice details.`}
                </p>
                <div>
                    <InputFieldTwo
                        label={c('Label').t`Company`}
                        placeholder={c('Placeholder').t`Company name`}
                        autoFocus
                        name="company"
                        data-testid="billing-address-company"
                        value={invoiceBillingAddress.BillingAddress.Company ?? ''}
                        onValue={(value: string) =>
                            setInvoiceBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, Company: value },
                            }))
                        }
                    />
                    {
                        // if user already has VAT number, then we don't let them edit it on the invoices
                        !initialFullBillingAddress.VatId && (
                            <InputFieldTwo
                                label={getVatNumberName(invoiceBillingAddress.BillingAddress.CountryCode)}
                                placeholder={c('Placeholder').t`VAT number`}
                                name="vat"
                                data-testid="billing-address-vat"
                                value={invoiceBillingAddress.VatId ?? ''}
                                onValue={(value: string) =>
                                    setInvoiceBillingAddress((model) => ({
                                        ...model,
                                        VatId: value,
                                    }))
                                }
                            />
                        )
                    }
                    <InputFieldTwo
                        label={c('Label').t`First name`}
                        placeholder={c('Placeholder').t`Thomas`}
                        name="firstname"
                        data-testid="billing-address-firstname"
                        value={invoiceBillingAddress.BillingAddress.FirstName ?? ''}
                        onValue={(value: string) =>
                            setInvoiceBillingAddress((model) => ({
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
                        value={invoiceBillingAddress.BillingAddress.LastName ?? ''}
                        onValue={(value: string) =>
                            setInvoiceBillingAddress((model) => ({
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
                        value={invoiceBillingAddress.BillingAddress.Address ?? ''}
                        onValue={(value: string) =>
                            setInvoiceBillingAddress((model) => ({
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
                        value={invoiceBillingAddress.BillingAddress.City ?? ''}
                        onValue={(value: string) =>
                            setInvoiceBillingAddress((model) => ({
                                ...model,
                                BillingAddress: { ...model.BillingAddress, City: value },
                            }))
                        }
                    />
                    {showPostalCode && (
                        <InputFieldTwo
                            label={
                                invoiceBillingAddress.BillingAddress.CountryCode === 'US'
                                    ? c('Label').t`ZIP code`
                                    : c('Label').t`Postal code`
                            }
                            placeholder="12345"
                            name="zipcode"
                            data-testid="billing-address-zipcode"
                            value={invoiceBillingAddress.BillingAddress.ZipCode ?? ''}
                            onValue={(value: string) =>
                                setInvoiceBillingAddress((model) => ({
                                    ...model,
                                    BillingAddress: { ...model.BillingAddress, ZipCode: value },
                                }))
                            }
                            error={validator([
                                zipCodeValidator(
                                    invoiceBillingAddress.BillingAddress.CountryCode,
                                    invoiceBillingAddress.BillingAddress.ZipCode
                                ),
                            ])}
                        />
                    )}
                </div>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading}>{c('Action').t`Save`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

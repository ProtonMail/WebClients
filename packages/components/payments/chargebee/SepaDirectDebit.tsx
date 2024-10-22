import { useEffect, useState } from 'react';

import { electronicFormatIBAN, isValidIBAN } from 'ibantools';
import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { InputFieldTwo, Label } from '@proton/components';
import { type FormErrorsHook } from '@proton/components/components/v2/useFormErrors';
import CountriesDropdown from '@proton/components/containers/payments/CountriesDropdown';
import { extractIBAN } from '@proton/payments';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { type ChargebeeDirectDebitProcessorHook } from '../react-extensions/useSepaDirectDebit';
import { ChargebeeIframe } from './ChargebeeIframe';
import { type ChargebeeWrapperProps } from './ChargebeeWrapper';
import { SepaAuthorizationText } from './SepaAuthorizationText';

export interface DirectDebitProps extends ChargebeeWrapperProps {
    directDebit: ChargebeeDirectDebitProcessorHook;
    formErrors?: FormErrorsHook;
}

export const SepaDirectDebit = ({ directDebit, formErrors, ...rest }: DirectDebitProps) => {
    const { validator } = formErrors ?? {};

    const { email, company, firstName, lastName } = directDebit.customer;
    const iban = directDebit.bankAccount.iban;
    const electronicIban = electronicFormatIBAN(iban) ?? '';

    const [showCountryCode, setShowCountryCode] = useState(false);

    useEffect(() => {
        const { valid, requiresAddress, countryCode } = extractIBAN(electronicIban);
        if (!valid) {
            return;
        }

        if (!showCountryCode && requiresAddress) {
            setShowCountryCode(true);
            if (countryCode) {
                directDebit.setCountryCode(countryCode);
            }
            return;
        }

        if (showCountryCode && !requiresAddress) {
            setShowCountryCode(false);
            directDebit.setCountryCode('');
            directDebit.setAddressLine1('');
            return;
        }
    }, [electronicIban]);

    const loading = directDebit.processingToken;

    return (
        <div>
            <Label htmlFor="sepa-customer-email" className="field-two-label field-two-label-container flex pt-3">{c(
                'Label'
            ).t`Email`}</Label>
            <InputFieldTwo
                placeholder={c('Label').t`Email`}
                value={email}
                onValue={directDebit.setEmail}
                id="sepa-customer-email"
                disableChange={loading}
                autoComplete="off"
                name="sepa-customer-email"
                error={validator?.([requiredValidator(email), emailValidator(email)])}
                dense={true}
                data-protonpass-ignore={true}
            />

            {directDebit.customer.customerNameType === 'company' ? (
                <>
                    <Label htmlFor="company-name" className="field-two-label field-two-label-container flex pt-3">{c(
                        'Label'
                    ).t`Company name`}</Label>
                    <InputFieldTwo
                        placeholder={c('Label').t`Company name`}
                        value={company}
                        onValue={directDebit.setCompanyName}
                        id="company-name"
                        disableChange={loading}
                        autoComplete="off"
                        name="company-name"
                        error={validator?.([requiredValidator(company)])}
                        dense={true}
                        data-protonpass-ignore={true}
                    />
                </>
            ) : (
                <div className="md:flex md:flew-row">
                    <div className="sm:w-full md:w-1/2 md:pr-1">
                        <Label htmlFor="first-name" className="field-two-label field-two-label-container flex pt-3">{c(
                            'Label'
                        ).t`First name`}</Label>
                        <InputFieldTwo
                            placeholder={c('Label').t`Thomas`}
                            value={firstName}
                            onValue={directDebit.setFirstName}
                            id="first-name"
                            disableChange={loading}
                            autoComplete="off"
                            name="first-name"
                            error={validator?.([requiredValidator(firstName)])}
                            dense={true}
                            data-protonpass-ignore={true}
                        />
                    </div>
                    <div className="sm:w-full md:w-1/2 md:pl-1">
                        <Label htmlFor="last-name" className="field-two-label field-two-label-container flex pt-3">{c(
                            'Label'
                        ).t`Last name`}</Label>
                        <InputFieldTwo
                            placeholder={c('Label').t`Anderson`}
                            value={lastName}
                            onValue={directDebit.setLastName}
                            id="last-name"
                            disableChange={loading}
                            autoComplete="off"
                            name="last-name"
                            error={validator?.([requiredValidator(lastName)])}
                            dense={true}
                            data-protonpass-ignore={true}
                        />
                    </div>
                </div>
            )}
            <Button
                color="weak"
                shape="underline"
                size="small"
                className="text-sm color-weak"
                onClick={() =>
                    directDebit.setCustomerNameType(
                        directDebit.customer.customerNameType === 'individual' ? 'company' : 'individual'
                    )
                }
            >
                {directDebit.customer.customerNameType === 'individual'
                    ? c('Payment.Sepa.Action').t`Use company name`
                    : c('Payment.Sepa.Action').t`Use personal name`}
            </Button>
            <Label htmlFor="iban" className="field-two-label field-two-label-container flex pt-3">{c('Label')
                .t`IBAN`}</Label>
            <InputFieldTwo
                placeholder={'XX00 0000 0000 0000 0000 00'}
                value={iban}
                onValue={(iban: string) => {
                    directDebit.setBankAccount((bankAccount) => ({
                        ...bankAccount,
                        iban,
                    }));
                }}
                id="iban"
                disableChange={loading}
                autoComplete="off"
                name="iban"
                error={validator?.([
                    requiredValidator(electronicIban),
                    isValidIBAN(electronicIban) ? '' : c('Error').t`Invalid IBAN`,
                ])}
                dense={true}
            />
            {showCountryCode && (
                <>
                    <Label htmlFor="country" className="field-two-label field-two-label-container flex pt-3">{c('Label')
                        .t`Country`}</Label>
                    <CountriesDropdown
                        onChange={directDebit.setCountryCode}
                        autoComplete="country"
                        selectedCountryCode={directDebit.customer.countryCode}
                        data-testid="country"
                        id="country"
                        disabled={loading}
                    />
                    <Label htmlFor="address" className="field-two-label field-two-label-container flex pt-3">{c('Label')
                        .t`Address`}</Label>
                    <InputFieldTwo
                        placeholder={c('Label').t`Route de la Galaise 32, 1228 Plan-les-Ouates, Geneva`}
                        value={directDebit.customer.addressLine1}
                        onValue={directDebit.setAddressLine1}
                        id="address"
                        disableChange={loading}
                        autoComplete="off"
                        name="address"
                        error={validator?.([requiredValidator(directDebit.customer.addressLine1)])}
                        dense={true}
                        data-testid="sepa-address"
                        aria-describedby="address-decription"
                    />
                    <span id="address-decription" className="text-sm color-weak">
                        {c('Payments.Sepa').t`Street address, postal code, and city`}
                    </span>
                </>
            )}
            <div className="mt-2">
                <SepaAuthorizationText />
            </div>

            <ChargebeeIframe type="direct-debit" {...rest} />
        </div>
    );
};

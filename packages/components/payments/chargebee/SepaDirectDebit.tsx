import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants, Button } from '@proton/atoms';
import Label from '@proton/components/components/label/Label';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { ChargebeeIframe, CountriesDropdown } from '@proton/payments/ui';
import { type ChargebeeWrapperProps } from '@proton/payments/ui';

import { type ChargebeeDirectDebitProcessorHook } from '../react-extensions/useSepaDirectDebit';
import { SepaAuthorizationText } from './SepaAuthorizationText';

export interface DirectDebitProps extends ChargebeeWrapperProps {
    directDebit: ChargebeeDirectDebitProcessorHook;
    isCurrencyOverriden: boolean;
}

export const SepaDirectDebit = ({ directDebit, isCurrencyOverriden, ...rest }: DirectDebitProps) => {
    const [showCountryCode, setShowCountryCode] = useState(false);
    const { valid, requiresAddress, countryCode } = directDebit.ibanStatus;

    useEffect(() => {
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
    }, [valid, requiresAddress, countryCode]);

    const loading = directDebit.processingToken;
    const {
        customer: { company, firstName, lastName },
        errors,
    } = directDebit;

    return (
        <div>
            {directDebit.customer.customerNameType === 'company' ? (
                <InputFieldTwo
                    placeholder={c('Label').t`Company name`}
                    value={company}
                    onValue={directDebit.setCompanyName}
                    id="company-name"
                    disableChange={loading}
                    autoComplete="off"
                    name="company-name"
                    error={errors.companyError}
                    dense={true}
                    data-protonpass-ignore={true}
                    label={c('Label').t`Company name`}
                />
            ) : (
                <div className="md:flex md:flew-row">
                    <div className="sm:w-full md:w-1/2 md:pr-1">
                        <InputFieldTwo
                            label={c('Label').t`First name`}
                            placeholder={c('Label').t`Thomas`}
                            value={firstName}
                            onValue={directDebit.setFirstName}
                            id="first-name"
                            disableChange={loading}
                            autoComplete="off"
                            name="first-name"
                            error={errors.firstNameError}
                            dense={true}
                            data-protonpass-ignore={true}
                        />
                    </div>
                    <div className="sm:w-full md:w-1/2 md:pl-1">
                        <InputFieldTwo
                            label={c('Label').t`Last name`}
                            placeholder={c('Label').t`Anderson`}
                            value={lastName}
                            onValue={directDebit.setLastName}
                            id="last-name"
                            disableChange={loading}
                            autoComplete="off"
                            name="last-name"
                            error={errors.lastNameError}
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
                className="text-sm color-weak mb-3"
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
            <InputFieldTwo
                label={c('Label').t`IBAN`}
                placeholder={'XX00 0000 0000 0000 0000 00'}
                value={directDebit.bankAccount.iban}
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
                error={errors.ibanError}
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
                        className="mb-3"
                    />
                    <InputFieldTwo
                        label={c('Label').t`Address`}
                        placeholder={c('Label').t`Route de la Galaise 32, 1228 Plan-les-Ouates, Geneva`}
                        value={directDebit.customer.addressLine1}
                        onValue={directDebit.setAddressLine1}
                        id="address"
                        disableChange={loading}
                        autoComplete="off"
                        name="address"
                        error={errors.addressError}
                        dense={true}
                        data-testid="sepa-address"
                        aria-describedby="address-decription"
                    />
                    <span id="address-decription" className="text-sm color-weak">
                        {
                            // translator: this is a note right below the address field in SEPA payment method. This note explains to the user which information should be provided in the text field.
                            c('Payments.Sepa').t`Street address, postal code, and city`
                        }
                    </span>
                </>
            )}
            <div className="my-2">
                <SepaAuthorizationText />
            </div>

            {isCurrencyOverriden && (
                <Banner className="mt-2 mb-4" variant={BannerVariants.INFO}>{c('Payments')
                    .t`Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.`}</Banner>
            )}

            <ChargebeeIframe type="direct-debit" {...rest} />
        </div>
    );
};

import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { selectUser } from '@proton/account/user';
import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import { pick } from '@proton/shared/lib/helpers/object';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type {
    BillingAddressExtended,
    BillingAddressExtraProperties,
    FullBillingAddressFlat,
} from '../../../core/billing-address/billing-address';
import type { ADDON_NAMES, PLANS } from '../../../core/constants';
import { hasWrongBillingAddressError } from '../../../core/errors';
import type { PaymentsApi } from '../../../core/interface';
import { getIsB2BAudienceFromPlan } from '../../../core/plan/helpers';
import type { TaxCountryHook } from './useTaxCountry';
import { getVatFormErrors } from './useVatFormValidation';

export type FullBillingAddressWithoutCountry = Omit<FullBillingAddressFlat, 'CountryCode' | 'State' | 'ZipCode'>;

interface VatNumberHookProps {
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    onVatChange?: (value: string) => unknown;
    onBillingAddressChange?: (fullBillingAddress: FullBillingAddressWithoutCountry) => unknown;
    isAuthenticated?: boolean;
    paymentsApi?: PaymentsApi;
    taxCountry: TaxCountryHook;
    onVatUpdated?: (vatNumber: string | null) => unknown | Promise<unknown>;
    paymentFacade?: PaymentFacade;
    initialBillingAddress?: BillingAddressExtended;
    initialVatNumber?: string;
}

export type VatNumberHook = ReturnType<typeof useVatNumber>;

const countriesWithVatId = new Set([
    // EU member states (27)
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',

    // Additional EFTA / European countries
    'CH',
    'GB',
    'NO',
    'LI',
    'IS',

    // Countries for Batch 1 tax exclusive
    'AU',
    'SG',
]);

const INITIAL_BILLING_ADDRESS_EXTRA: BillingAddressExtraProperties = {
    Company: undefined,
    FirstName: undefined,
    LastName: undefined,
    Address: undefined,
    City: undefined,
};

export const useVatNumber = ({
    selectedPlanName,
    onVatChange,
    onBillingAddressChange,
    isAuthenticated: isAuthenticatedProp,
    paymentsApi: paymentsApiProp,
    taxCountry,
    onVatUpdated,
    paymentFacade,
    initialBillingAddress,
    initialVatNumber,
}: VatNumberHookProps) => {
    const showExtendedBillingAddressForm = useFlag('PaymentsValidateBillingAddress');
    const store = useStore();
    const isAuthenticated = isAuthenticatedProp ?? !!selectUser(store.getState())?.value;
    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const paymentsApi = paymentsApiProp ?? defaultPaymentsApi;
    const [loadingBillingDetails, withLoading] = useLoading();
    const [loaded, setLoaded] = useState(false);

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlanName);

    const enableVatNumber = isB2BPlan;
    const [vatNumber, setVatNumber] = useState(initialVatNumber ?? '');
    const [billingAddressExtra, setBillingAddressExtra] = useState<BillingAddressExtraProperties>({
        ...INITIAL_BILLING_ADDRESS_EXTRA,
        ...pick(
            initialBillingAddress ?? ({} as BillingAddressExtraProperties),
            Object.keys(INITIAL_BILLING_ADDRESS_EXTRA) as (keyof BillingAddressExtraProperties)[]
        ),
    });

    const [unauthenticatedCollapsed, setUnauthenticatedCollapsed] = useState(
        !Object.values(billingAddressExtra).some(isTruthy)
    );

    const fetchVatNumber = async () => {
        const result = await paymentsApi.getFullBillingAddress();

        setVatNumber(result.VatId ?? '');
        setBillingAddressExtra({
            Company: result.BillingAddress.Company ?? '',
            FirstName: result.BillingAddress.FirstName ?? '',
            LastName: result.BillingAddress.LastName ?? '',
            Address: result.BillingAddress.Address ?? '',
            City: result.BillingAddress.City ?? '',
        });

        setLoaded(true);
    };

    useEffect(() => {
        if (!isAuthenticated || !enableVatNumber || vatNumber || loaded) {
            return;
        }

        withLoading(fetchVatNumber()).catch(noop);
    }, [isAuthenticated, enableVatNumber]);

    const handleVatNumberChange = (newVatNumber: string) => {
        setVatNumber(newVatNumber);
        const fullBillingAddress: FullBillingAddressFlat = {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            ...billingAddressExtra,
            VatId: newVatNumber,
        };

        const vatFormErrors = getVatFormErrors(fullBillingAddress, showExtendedBillingAddressForm);

        if (!vatFormErrors.hasErrors) {
            onVatChange?.(newVatNumber);
        }
    };

    const handleBillingAddressChange = (billingAddressExtraProperties: BillingAddressExtraProperties) => {
        const fullBillingAddress: FullBillingAddressFlat = {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            ...billingAddressExtraProperties,
            VatId: vatNumber,
        };

        const vatFormErrors = getVatFormErrors(fullBillingAddress, showExtendedBillingAddressForm);

        if (!vatFormErrors.hasErrors) {
            onBillingAddressChange?.(fullBillingAddress);
        }
    };

    const updateBillingAddressField = <K extends keyof BillingAddressExtraProperties>(
        field: K,
        value: BillingAddressExtraProperties[K]
    ) => {
        const updated: BillingAddressExtraProperties = {
            ...billingAddressExtra,
            [field]: value ? value : undefined,
        };
        setBillingAddressExtra(updated);
        handleBillingAddressChange(updated);
    };

    useEffect(() => {
        // we don't want to set the VAT number in POST subscription if the country doesn't support VAT IDs or if the
        // plan is not B2B. However if the vatNumber is already empty, we don't need to trigger an update.
        if (!!vatNumber && (!countriesWithVatId.has(taxCountry.selectedCountryCode) || !isB2BPlan)) {
            handleVatNumberChange('');
        }
    }, [taxCountry.selectedCountryCode, isB2BPlan]);

    const vatUpdatedInModal = async (vatNumber: string | undefined) => {
        const newVatNumber = vatNumber ?? '';
        handleVatNumberChange(newVatNumber);
        if (isAuthenticated) {
            await onVatUpdated?.(newVatNumber);
        }
    };

    const renderVatNumberInput = isB2BPlan && countriesWithVatId.has(taxCountry.selectedCountryCode);

    const vatFormErrors = getVatFormErrors(
        {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            ...billingAddressExtra,
            VatId: vatNumber,
        },
        showExtendedBillingAddressForm
    );

    const vatFormValid = !vatFormErrors.hasErrors && !hasWrongBillingAddressError(paymentFacade?.checkResult);
    const vatFormErrorMessage = !vatFormValid ? c('Error').t`Please complete the billing details` : undefined;

    return {
        ...billingAddressExtra,
        setCompany: (value: string) => updateBillingAddressField('Company', value),
        setFirstName: (value: string) => updateBillingAddressField('FirstName', value),
        setLastName: (value: string) => updateBillingAddressField('LastName', value),
        setAddress: (value: string) => updateBillingAddressField('Address', value),
        setCity: (value: string) => updateBillingAddressField('City', value),
        loadingBillingDetails,
        vatNumber,
        setVatNumber: handleVatNumberChange,
        enableVatNumber,
        renderVatNumberInput,
        vatFormValid,
        vatFormErrorMessage,
        vatUpdatedInModal,
        paymentsApi,
        /**
         * If user is authenticated, we no longer allow inline editing of VAT number or billing address. Instead, we
         * will show the modal for editing full billing address.
         */
        shouldEditInModal: isAuthenticated,
        unauthenticatedCollapsed,
        setUnauthenticatedCollapsed: (isCollapsed: boolean) => {
            setUnauthenticatedCollapsed(isCollapsed);
            if (isCollapsed) {
                setVatNumber('');
                setBillingAddressExtra(INITIAL_BILLING_ADDRESS_EXTRA);
            }
        },
    };
};

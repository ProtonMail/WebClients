import { useEffect, useRef, useState } from 'react';

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
    FullBillingAddress,
    FullBillingAddressFlat,
} from '../../../core/billing-address/billing-address';
import type { ADDON_NAMES, PLANS } from '../../../core/constants';
import { hasWrongBillingAddressError } from '../../../core/errors';
import type { PaymentsApi } from '../../../core/interface';
import { getIsB2BAudienceFromPlan } from '../../../core/plan/helpers';
import { countriesWithVatNumberOnSignup } from './countriesWithVatId';
import type { TaxCountryHook } from './useTaxCountry';
import { getVatFormErrors } from './useVatFormValidation';
import { getVatPrefix } from './vatPrefixHelper';

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

    const [, forceRender] = useState(0);
    const triggerRerender = () => forceRender((prev) => prev + 1);

    const enableVatNumber = isB2BPlan;
    const [vatNumber, setVatNumber] = useState(initialVatNumber ?? '');
    const isPristineRef = useRef(!initialVatNumber);
    const previousCountryRef = useRef(taxCountry.selectedCountryCode);
    const billingAddressExtraRef = useRef<BillingAddressExtraProperties>({
        ...INITIAL_BILLING_ADDRESS_EXTRA,
        ...pick(
            initialBillingAddress ?? ({} as BillingAddressExtraProperties),
            Object.keys(INITIAL_BILLING_ADDRESS_EXTRA) as (keyof BillingAddressExtraProperties)[]
        ),
    });

    const markDirty = () => {
        isPristineRef.current = false;
    };
    const resetPristine = () => {
        isPristineRef.current = true;
    };

    const setBillingAddressExtra = (billingAddressExtra: BillingAddressExtraProperties) => {
        billingAddressExtraRef.current = billingAddressExtra;
        triggerRerender();
    };

    const [unauthenticatedCollapsed, setUnauthenticatedCollapsed] = useState(
        !Object.values(billingAddressExtraRef.current).some(isTruthy)
    );

    const fetchVatNumber = async () => {
        const result = await paymentsApi.getFullBillingAddress();

        if (result.VatId) {
            markDirty();
            setVatNumber(result.VatId);
        }
        // If no stored VatId, keep the current prefilled prefix as-is

        setBillingAddressExtra({
            Company: result.BillingAddress?.Company ?? '',
            FirstName: result.BillingAddress?.FirstName ?? '',
            LastName: result.BillingAddress?.LastName ?? '',
            Address: result.BillingAddress?.Address ?? '',
            City: result.BillingAddress?.City ?? '',
        });

        setLoaded(true);
    };

    useEffect(() => {
        if (!isAuthenticated || !enableVatNumber || (!isPristineRef.current && vatNumber) || loaded) {
            return;
        }

        withLoading(fetchVatNumber()).catch(noop);
    }, [isAuthenticated, enableVatNumber]);

    const handleVatNumberChange = (newVatNumber: string) => {
        markDirty();
        setVatNumber(newVatNumber);
        const fullBillingAddress: FullBillingAddressFlat = {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            ...billingAddressExtraRef.current,
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
            ...billingAddressExtraRef.current,
            [field]: value ? value : undefined,
        };
        setBillingAddressExtra(updated);
        handleBillingAddressChange(updated);
    };

    const updateBillingAddressFields = (billingAddressExtra: BillingAddressExtraProperties) => {
        setBillingAddressExtra(billingAddressExtra);
        handleBillingAddressChange(billingAddressExtra);
    };

    // See also: useVatPrefixSync — This copy stays inline due to signup-specific behaviour
    useEffect(() => {
        const inVatCountry = countriesWithVatNumberOnSignup.has(taxCountry.selectedCountryCode) && isB2BPlan;
        const countryChanged = previousCountryRef.current !== taxCountry.selectedCountryCode;
        previousCountryRef.current = taxCountry.selectedCountryCode;

        if (!inVatCountry) {
            if (vatNumber) {
                setVatNumber('');
                onVatChange?.('');
            }
            resetPristine();
            return;
        }

        if (countryChanged && !isPristineRef.current) {
            // The previously entered VAT belongs to the old country and is no longer valid — clear it in the parent.
            onVatChange?.('');
        }

        // Only prefill the prefix when the VAT form is actually shown inline. When the form is
        // hidden (business checkbox unchecked) or edited in a modal, leave vatNumber empty.
        const isVatFormVisible = !isAuthenticated && !unauthenticatedCollapsed;
        const canPrefillVatNumber = isVatFormVisible && (isPristineRef.current || countryChanged);

        if (canPrefillVatNumber) {
            // onVatChange is intentionally NOT called here: a bare prefix is not a valid VAT number
            // and should not propagate to the parent until the user completes it.
            const prefix = getVatPrefix(taxCountry.selectedCountryCode) ?? '';
            setVatNumber(prefix);
            resetPristine();
        }
    }, [taxCountry.selectedCountryCode, isB2BPlan]);

    const vatUpdatedInModal = async (fullBillingAddress: FullBillingAddress) => {
        const newVatNumber = fullBillingAddress.VatId ?? '';
        updateBillingAddressFields(fullBillingAddress.BillingAddress);
        handleVatNumberChange(newVatNumber);
        if (isAuthenticated) {
            await onVatUpdated?.(newVatNumber);
        }
    };

    const renderVatNumberInput = isB2BPlan && countriesWithVatNumberOnSignup.has(taxCountry.selectedCountryCode);

    const vatFormErrors = getVatFormErrors(
        {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            ...billingAddressExtraRef.current,
            VatId: vatNumber,
        },
        showExtendedBillingAddressForm
    );

    const vatFormValid = !vatFormErrors.hasErrors && !hasWrongBillingAddressError(paymentFacade?.checkResult);
    const vatFormErrorMessage = !vatFormValid ? c('Error').t`Please complete the billing details` : undefined;

    return {
        ...billingAddressExtraRef.current,
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
                resetPristine();
                setVatNumber('');
                setBillingAddressExtra(INITIAL_BILLING_ADDRESS_EXTRA);
            } else {
                resetPristine();
                // onVatChange intentionally not called — prefix alone is not a valid VAT number.
                const prefix = getVatPrefix(taxCountry.selectedCountryCode) ?? '';
                setVatNumber(prefix);
            }
        },
    };
};

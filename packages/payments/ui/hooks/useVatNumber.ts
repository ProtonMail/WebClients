import { useEffect, useState } from 'react';

import { selectUser } from '@proton/account/user';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import type { ADDON_NAMES, PLANS } from '../../core/constants';
import type { PaymentsApi } from '../../core/interface';
import { getIsB2BAudienceFromPlan } from '../../core/plan/helpers';
import type { TaxCountryHook } from './useTaxCountry';

interface VatNumberHookProps {
    selectedPlanName: PLANS | ADDON_NAMES | undefined;
    onChange?: (value: string) => unknown;
    isAuthenticated?: boolean;
    paymentsApi?: PaymentsApi;
    taxCountry: TaxCountryHook;
    onVatUpdated?: (vatNumber: string | null) => unknown | Promise<unknown>;
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
]);

export const useVatNumber = ({
    selectedPlanName,
    onChange,
    isAuthenticated: isAuthenticatedProp,
    paymentsApi: paymentsApiProp,
    taxCountry,
    onVatUpdated,
}: VatNumberHookProps) => {
    const store = useStore();
    const isAuthenticated = isAuthenticatedProp ?? !!selectUser(store.getState())?.value;
    const { paymentsApi: defaultPaymentsApi } = usePaymentsApi();
    const paymentsApi = paymentsApiProp ?? defaultPaymentsApi;
    const [loadingBillingDetails, withLoading] = useLoading();
    const [loaded, setLoaded] = useState(false);

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlanName);

    const enableVatNumber = isB2BPlan;
    const [vatNumber, setVatNumber] = useState('');

    const fetchVatNumber = async () => {
        const result = await paymentsApi.getFullBillingAddress();
        const vatId = result.VatId;
        setVatNumber(vatId ?? '');
        setLoaded(true);

        return vatId;
    };

    useEffect(() => {
        if (!isAuthenticated || !enableVatNumber || vatNumber || loaded) {
            return;
        }

        withLoading(fetchVatNumber()).catch(noop);
    }, [isAuthenticated, enableVatNumber]);

    const handleVatNumberChange = (value: string) => {
        setVatNumber(value);
        onChange?.(value);
    };

    useEffect(
        function resetVatNumber() {
            // we don't want to set the VAT number in POST subscription if the country doesn't support VAT IDs or if the
            // plan is not B2B
            if (!countriesWithVatId.has(taxCountry.selectedCountryCode) || !isB2BPlan) {
                handleVatNumberChange('');
            }
        },
        [taxCountry.selectedCountryCode, isB2BPlan]
    );

    const vatUpdatedInModal = async (vatId: string | undefined) => {
        handleVatNumberChange(vatId ?? '');
        if (isAuthenticated) {
            await onVatUpdated?.(vatNumber);
        }
    };

    return {
        loadingBillingDetails,
        vatNumber,
        setVatNumber: handleVatNumberChange,
        enableVatNumber,
        renderVatNumberInput: isB2BPlan && countriesWithVatId.has(taxCountry.selectedCountryCode),
        vatUpdatedInModal,
        paymentsApi,
        isAuthenticated,
    };
};

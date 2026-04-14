import type { User } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { FreeSubscription } from '../../../core/interface';
import type { Subscription } from '../../../core/subscription/interface';
import { useEditBillingAddressModal } from '../containers/useEditBillingAddressModal';
import type { TaxCountryHook } from '../hooks/useTaxCountry';
import type { VatNumberHook } from '../hooks/useVatNumber';
import { TaxCountrySelector } from './TaxCountrySelector';
import { VatNumberInput } from './VatNumberInput';

interface Props {
    user: User | undefined;
    taxCountry: TaxCountryHook | undefined;
    vatNumber: VatNumberHook | undefined;
    subscription: Subscription | FreeSubscription | undefined;
}

export const TaxFields = ({ user, taxCountry, vatNumber, subscription }: Props) => {
    const { editBillingAddressModal, openBillingAddressModal, loadingByKey } = useEditBillingAddressModal();

    const onEditClick = (loadingKey: string) => {
        openBillingAddressModal({
            paymentsApi: taxCountry?.paymentsApi,
            loadingKey,
            subscription,
            taxCountry,
            vatNumber,
        }).catch(noop);
    };

    const billingCountryLoadingKey = 'billingCountry';
    const billingCountryInput = taxCountry && (
        <TaxCountrySelector
            user={user}
            onInlineClick={() => onEditClick(billingCountryLoadingKey)}
            loadingBillingAddressModal={loadingByKey[billingCountryLoadingKey]}
            defaultCollapsed={true}
            className="mb-4"
            {...taxCountry}
        />
    );

    const vatLoadingKey = 'vat';
    const vatInput = taxCountry && vatNumber && (
        <VatNumberInput
            className="mb-4"
            taxCountry={taxCountry}
            onInlineClick={() => onEditClick(vatLoadingKey)}
            loadingBillingAddressModal={loadingByKey[vatLoadingKey]}
            {...vatNumber}
        />
    );

    return (
        <>
            {editBillingAddressModal}
            {billingCountryInput}
            {vatInput}
        </>
    );
};

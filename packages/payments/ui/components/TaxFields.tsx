import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import type { User } from '@proton/shared/lib/interfaces';

import type { FreeSubscription } from '../../core/interface';
import type { Subscription } from '../../core/subscription/interface';
import { useEditBillingAddressModal } from '../containers/EditBillingAddress/useEditBillingAddressModal';
import type { TaxCountryHook } from '../hooks/useTaxCountry';
import type { VatNumberHook } from '../hooks/useVatNumber';
import { TaxCountrySelector } from './TaxCountrySelector/TaxCountrySelector';
import { VatNumberInput } from './VatNumberInput';

interface Props {
    user: User | undefined;
    taxCountry: TaxCountryHook | undefined;
    vatNumber: VatNumberHook | undefined;
    subscription: Subscription | FreeSubscription | undefined;
}

export const TaxFields = ({ user, taxCountry, vatNumber, subscription }: Props) => {
    const { editBillingAddressModal, openBillingAddressModal, loadingByKey } = useEditBillingAddressModal();
    const { createNotification } = useNotifications();

    const onEditClick = async (loadingKey: string) => {
        try {
            const fullBillingAddress = await openBillingAddressModal({
                paymentsApi: taxCountry?.paymentsApi,
                loadingKey,
                subscription,
            });

            createNotification({
                type: 'success',
                text: c('Success').t`Billing information updated`,
            });

            void vatNumber?.vatUpdatedInModal(fullBillingAddress.VatId ?? undefined);
            taxCountry?.billingAddressChangedInModal(fullBillingAddress.BillingAddress);
        } catch {}
    };

    const billingCountryLoadingKey = 'billingCountry';
    const billingCountryInput = taxCountry && (
        <TaxCountrySelector
            user={user}
            onInlineClick={() => onEditClick(billingCountryLoadingKey)}
            loadingBillingAddressModal={loadingByKey[billingCountryLoadingKey]}
            defaultCollapsed={true}
            className={vatNumber?.renderVatNumberInput ? 'mb-2' : 'mb-4'}
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

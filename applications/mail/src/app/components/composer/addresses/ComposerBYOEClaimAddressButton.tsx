import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { Icon, useModalState } from '@proton/components';
import PromotionButtonLight from '@proton/components/components/button/PromotionButton/PromotionButtonLight';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

const ComposerBYOEClaimAddressButton = () => {
    const [addresses] = useAddresses();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    if (!getIsBYOEOnlyAccount(addresses)) {
        return null;
    }

    return (
        <>
            <PromotionButtonLight
                size="small"
                className="inline-flex shrink-0 ml-auto my-1 md:my-0"
                onClick={() => setClaimProtonAddressModalProps(true)}
            >
                <span className="text-sm inline-flex flex-row flex-nowrap items-center">
                    {c('Action').t`Claim your free ${BRAND_NAME} address`}
                    <Icon
                        name="chevron-right"
                        className="ml-1 mr-custom"
                        style={{ '--mr-custom': 'calc(var(--space-1) * -1)' }}
                    />
                </span>
            </PromotionButtonLight>

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal toApp={APPS.PROTONMAIL} {...claimProtonAddressModalProps} />
            )}
        </>
    );
};

export default ComposerBYOEClaimAddressButton;

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import BYOEClaimProtonAddressModal from '@proton/byoe/src/components/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '@proton/byoe/src/constants';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

export const ClaimProtonAddressToolbarButton = () => {
    const [addresses] = useAddresses();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const isPureBYOE = getIsBYOEOnlyAccount(addresses);

    if (!isPureBYOE) {
        return null;
    }

    return (
        <>
            <InlineLinkButton className="color-weak" onClick={() => setClaimProtonAddressModalProps(true)}>
                {c('Action').t`Claim ${BRAND_NAME} address`}
            </InlineLinkButton>
            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    source={BYOE_CLAIM_PROTON_ADDRESS_SOURCE.MAIL_TOOLBAR}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

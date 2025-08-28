import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { InlineLinkButton } from '@proton/atoms';
import { useModalState } from '@proton/components';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';

const ClaimProtonAddressToolbarButton = () => {
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
                <BYOEClaimProtonAddressModal toApp={APPS.PROTONMAIL} {...claimProtonAddressModalProps} />
            )}
        </>
    );
};

export default ClaimProtonAddressToolbarButton;

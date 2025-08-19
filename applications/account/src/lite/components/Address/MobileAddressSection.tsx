import { c } from 'ttag';

import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useModalState } from '@proton/components/';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getStatus } from '@proton/components/containers/addresses/helper';
import { useLoading } from '@proton/hooks/index';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Address } from '@proton/shared/lib/interfaces';
import { getIsNonDefault, sortAddresses } from '@proton/shared/lib/mail/addresses';
import clsx from '@proton/utils/clsx';
import move from '@proton/utils/move';

import EditProfileModal from '../EditProfileModal';
import MobileSectionAction from '../MobileSectionAction';
import MobileSectionLabel from '../MobileSectionLabel';
import MobileSectionRow from '../MobileSectionRow';

const MobileAddressSection = () => {
    const dispatch = useDispatch();
    const [addresses = []] = useAddresses();

    const [savingDefaultAddress, withLoading] = useLoading(false);

    const list = sortAddresses(addresses);
    const [firstAddress] = list;

    const [profileModalProps, setProfileModal, renderProfileModal] = useModalState();

    const handleClickIdentityDetails = () => {
        setProfileModal(true);
    };

    const filteredAddresses = list?.filter((address) => !getIsNonDefault(address)) || [];

    const handleSetDefaultAddress = async (addressID: string) => {
        const oldIndex = list.findIndex((address) => address.ID === addressID);
        if (oldIndex === -1) {
            return;
        }

        const newIndex = 0;

        const newList = move(list, oldIndex, newIndex);
        const { isExternal, isDisabled } = getStatus(newList[0], 0);

        if (isDeepEqual(list, newList)) {
            return;
        }

        // Do not set disabled or external addresses as default
        if (newIndex === 0 && (isDisabled || isExternal)) {
            return;
        }

        await dispatch(orderAddresses({ member: undefined, addresses: newList }));
    };

    return (
        <>
            <MobileSectionRow stackContent>
                <MobileSectionLabel small htmlFor="addressSelector">{c('Label')
                    .t`Default email address`}</MobileSectionLabel>
                <SelectTwo<Address>
                    id="addressSelector"
                    onValue={(address) => withLoading(handleSetDefaultAddress(address.ID))}
                    value={firstAddress}
                    loading={savingDefaultAddress}
                    disabled={savingDefaultAddress}
                    className="mt-2"
                >
                    {filteredAddresses.map((address) => (
                        <Option key={address.ID} value={address} title={address.Email} />
                    ))}
                </SelectTwo>
            </MobileSectionRow>
            <MobileSectionAction onClick={handleClickIdentityDetails}>
                <MobileSectionLabel small htmlFor="displayName">{c('Label').t`Display name`}</MobileSectionLabel>
                <div className={clsx('text-lg mt-0.5', !firstAddress.DisplayName && 'color-weak')}>
                    {firstAddress.DisplayName || c('Placeholder').t`Choose display name`}
                </div>
            </MobileSectionAction>
            <MobileSectionAction onClick={handleClickIdentityDetails}>
                <MobileSectionLabel small htmlFor="signature">{c('Label').t`Signature`}</MobileSectionLabel>
                <div className="mt-0.5" id="signature" dangerouslySetInnerHTML={{ __html: firstAddress.Signature }} />
            </MobileSectionAction>

            {renderProfileModal && <EditProfileModal address={firstAddress} {...profileModalProps} />}
        </>
    );
};

export default MobileAddressSection;

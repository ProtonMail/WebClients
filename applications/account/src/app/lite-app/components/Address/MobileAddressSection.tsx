import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { isMailVersionOlderThan } from '@proton/shared/lib/mobile/isMailVersionOlderThan';
import clsx from '@proton/utils/clsx';

import EditProfileModal from '../EditProfileModal';
import MobileSectionAction from '../MobileSectionAction';
import MobileSectionLabel from '../MobileSectionLabel';
import MobileSectionRow from '../MobileSectionRow';
import { useDefaultAddress } from './useDefaultAddress';

const MobileAddressSection = () => {
    const { defaultAddress: firstAddress, options, saving, setDefaultAddress } = useDefaultAddress();

    // We want to show the edit signature field on older apps
    // - iOS older than 7.0.5
    // - android older than 7.0.12
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const appVersion = searchParams.get('app-version');
    const isOldMailApp =
        isMailVersionOlderThan(appVersion, 'ios', '7.0.5') || isMailVersionOlderThan(appVersion, 'android', '7.0.12');

    const [profileModalProps, setProfileModal, renderProfileModal] = useModalState();

    const handleClickIdentityDetails = () => {
        setProfileModal(true);
    };

    return (
        <>
            <MobileSectionRow stackContent>
                <MobileSectionLabel htmlFor="addressSelector">{c('Label').t`Default email address`}</MobileSectionLabel>
                <SelectTwo<Address>
                    id="addressSelector"
                    onValue={(address) => setDefaultAddress(address.ID)}
                    value={firstAddress}
                    loading={saving}
                    disabled={saving}
                    className="mt-2"
                >
                    {options.map((address) => (
                        <Option key={address.ID} value={address} title={address.Email} />
                    ))}
                </SelectTwo>
            </MobileSectionRow>
            {isOldMailApp && (
                <>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="displayName">{c('Label')
                            .t`Display name`}</MobileSectionLabel>
                        <div className={clsx('text-lg mt-0.5', !firstAddress.DisplayName && 'color-weak')}>
                            {firstAddress.DisplayName || c('Placeholder').t`Choose display name`}
                        </div>
                    </MobileSectionAction>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="signature">{c('Label').t`Signature`}</MobileSectionLabel>
                        <div
                            className="mt-0.5"
                            id="signature"
                            dangerouslySetInnerHTML={{ __html: firstAddress.Signature }}
                        />
                    </MobileSectionAction>
                </>
            )}
            {renderProfileModal && <EditProfileModal address={firstAddress} {...profileModalProps} />}
        </>
    );
};

export default MobileAddressSection;

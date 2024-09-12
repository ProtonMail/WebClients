import type { ReactNode } from 'react';

import { c } from 'ttag';

import {
    AccountRecoverySection,
    CrashReportsToggle,
    TelemetryToggle,
    useAddresses,
    useModalState,
} from '@proton/components';

import EditProfileModal from '../components/EditProfileModal';
import MobileSection from '../components/MobileSection';
import MobileSectionAction from '../components/MobileSectionAction';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

import './MobileSettings.scss';

const AccountSettings = ({
    layout,
    loader,
}: {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: React.ReactNode;
}) => {
    const [addresses = [], loadingAddresses] = useAddresses();
    const [firstAddress] = addresses;
    const { Email = '', DisplayName = '', Signature = '' } = firstAddress || {};
    const [profileModalProps, setProfileModal, renderProfileModal] = useModalState();
    const loading = loadingAddresses;

    const handleClickIdentityDetails = () => {
        setProfileModal(true);
    };

    if (loading) {
        return loader;
    }

    return layout(
        <>
            {renderProfileModal && <EditProfileModal address={firstAddress} {...profileModalProps} />}
            <div className="mobile-settings">
                <MobileSection title={c('Title').t`Account settings`}>
                    <MobileSectionRow stackContent>
                        <MobileSectionLabel small htmlFor="email">{c('Label').t`Email address`}</MobileSectionLabel>
                        <div className="text-lg mt-0.5">{Email}</div>
                    </MobileSectionRow>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="displayName">{c('Label')
                            .t`Display name`}</MobileSectionLabel>
                        <div className="text-lg mt-0.5">{DisplayName}</div>
                    </MobileSectionAction>
                    <MobileSectionAction onClick={handleClickIdentityDetails}>
                        <MobileSectionLabel small htmlFor="signature">{c('Label').t`Signature`}</MobileSectionLabel>
                        <div className="mt-0.5" id="signature" dangerouslySetInnerHTML={{ __html: Signature }} />
                    </MobileSectionAction>
                    <MobileSectionRow>
                        <MobileSectionLabel htmlFor="crashReports">{c('Label')
                            .t`Send crash reports`}</MobileSectionLabel>
                        <CrashReportsToggle id="crashReports" />
                    </MobileSectionRow>
                    <MobileSectionRow>
                        <MobileSectionLabel htmlFor="telemetry">
                            {c('Label').t`Collect usage diagnostics`}
                        </MobileSectionLabel>
                        <TelemetryToggle id="telemetry" />
                    </MobileSectionRow>
                </MobileSection>
                <div className="account-recovery">
                    <AccountRecoverySection />
                </div>
            </div>
        </>,
        { className: 'overflow-auto' }
    );
};

export default AccountSettings;

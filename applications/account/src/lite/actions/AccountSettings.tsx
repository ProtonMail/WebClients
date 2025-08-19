import { type ReactNode } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { AccountRecoverySection, CrashReportsToggle, TelemetryToggle } from '@proton/components';

import MobileAddressSection from '../components/Address/MobileAddressSection';
import MobileSection from '../components/MobileSection';
import MobileSectionLabel from '../components/MobileSectionLabel';
import MobileSectionRow from '../components/MobileSectionRow';

import './MobileSettings.scss';

const AccountSettings = ({
    layout,
    loader,
}: {
    layout: (children: ReactNode, props?: any) => ReactNode;
    loader: ReactNode;
}) => {
    const [, loadingAddresses] = useAddresses();
    const loading = loadingAddresses;

    if (loading) {
        return loader;
    }

    return layout(
        <>
            <div className="mobile-settings">
                <MobileSection>
                    <MobileAddressSection />
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

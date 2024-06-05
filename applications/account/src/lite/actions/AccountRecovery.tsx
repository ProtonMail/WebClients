import { ReactNode } from 'react';

import { c } from 'ttag';

import { AccountRecoverySection } from '@proton/components';

import MobileSection from '../components/MobileSection';

const AccountRecovery = ({ layout }: { layout: (children: ReactNode, props?: any) => ReactNode }) => {
    return layout(
        <div className="mobile-settings">
            <MobileSection title={c('Title').t`Account recovery`}>
                <AccountRecoverySection />
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default AccountRecovery;

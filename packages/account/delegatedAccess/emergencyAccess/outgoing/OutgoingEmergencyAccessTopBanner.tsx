import { useEffect } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import noop from '@proton/utils/noop';

import { useOutgoingDelegatedAccess } from '../../hooks';

const OutgoingEmergencyAccessTopBanner = () => {
    const { getOutgoingDelegatedAccess } = useOutgoingDelegatedAccess();

    useEffect(() => {
        getOutgoingDelegatedAccess().catch(noop);
    }, []);

    const user = '';

    return (
        <>
            {user && (
                <TopBanner className="bg-info">
                    {c('unprivatization').t`Your emergency contact ${user} is requesting access to your account.`}{' '}
                    <InlineLinkButton data-testid="delegated-access:request-button" key="button">
                        {c('unprivatization').t`View request`}
                    </InlineLinkButton>
                </TopBanner>
            )}
        </>
    );
};

export default OutgoingEmergencyAccessTopBanner;

import type { ReactElement, RefObject } from 'react';
import { useLocation } from 'react-router';

import { useReferralDiscover } from '../hooks/useReferralDiscover';
import { ReferralSpotlight } from './ReferralSpotlight';

interface Props {
    children?: ReactElement;
    anchorRef?: RefObject<HTMLElement>;
}

export const SettingsReferralSpotlight = ({ children, anchorRef }: Props) => {
    const location = useLocation();
    const referralSpotlight = useReferralDiscover(location);

    return (
        <ReferralSpotlight
            show={referralSpotlight.shouldShowSettingsSpotlight}
            onClose={referralSpotlight.onCloseSettingsSpotlight}
            anchorRef={anchorRef}
            originalPlacement="bottom-start"
            style={{ marginInlineStart: '1.25rem', '--arrow-offset': '1.25rem' }}
        >
            {children}
        </ReferralSpotlight>
    );
};

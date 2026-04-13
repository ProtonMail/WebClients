import { type ReactElement, type RefObject, useEffect } from 'react';

import { useReferralDiscover } from '../hooks/useReferralDiscover';
import { useReferralTelemetry } from '../hooks/useReferralTelemetry';
import { ReferralSpotlight } from './ReferralSpotlight';

interface Props {
    children?: ReactElement;
    anchorRef?: RefObject<HTMLElement>;
}

export const SettingsReferralSpotlight = ({ children, anchorRef }: Props) => {
    const referralSpotlight = useReferralDiscover();
    const { sendSettingsSpotlightView } = useReferralTelemetry();

    useEffect(() => {
        if (referralSpotlight.shouldShowSettingsSpotlight) {
            sendSettingsSpotlightView();
        }
    }, [referralSpotlight.shouldShowSettingsSpotlight, sendSettingsSpotlightView]);

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

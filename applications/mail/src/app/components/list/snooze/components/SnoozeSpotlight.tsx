import React, { useRef } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight, useSpotlightShow } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';

import useSnooze from 'proton-mail/hooks/actions/useSnooze';

interface Props {
    children: React.ReactNode;
}

const SnoozeSpotlight = ({ children }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    const { canSnooze } = useSnooze();
    const { show: showSpotlight, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightSnooze, canSnooze);
    const show = useSpotlightShow(showSpotlight);

    return (
        <Spotlight
            originalPlacement="bottom-end"
            show={show}
            onDisplayed={onDisplayed}
            onClose={onClose}
            anchorRef={ref}
            type="new"
            content={
                <>
                    <p className="text-lg text-bold mb-1 mt-0">{c('Spotlight').t`Snooze is now available!`}</p>
                    <p className="m-0">{c('Spotlight')
                        .t`Set aside emails, and be reminded at a more convenient time.`}</p>
                    <SettingsLink path="/auto-reply" app={APPS.PROTONMAIL}>{c('Link')
                        .t`Set up email forwarding`}</SettingsLink>
                </>
            }
        >
            <div ref={ref}>{children}</div>
        </Spotlight>
    );
};

export default SnoozeSpotlight;

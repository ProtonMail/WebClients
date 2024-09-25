import type { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight, useSpotlightShow } from '@proton/components';
import { useSpotlightOnFeature, useUser } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { APPS, MONTH } from '@proton/shared/lib/constants';
import loadContentImg from '@proton/styles/assets/img/illustrations/spotlight-load-content.svg';

interface Props {
    children: ReactElement;
    anchorRef: RefObject<HTMLElement>;
}

const LoadContentSpotlight = ({ children, anchorRef }: Props) => {
    const [user] = useUser();
    // Load content spotlight needs to be displayed if account is older than one month
    const userCreateTime = user.CreateTime || 0;
    const isAccountOlderThanOneMonth = Date.now() > userCreateTime * 1000 + MONTH;

    const { show: showLoadContentSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightLoadContent,
        isAccountOlderThanOneMonth
    );
    const show = useSpotlightShow(showLoadContentSpotlight);
    // translator: This string is part of a longer string and is used to redirect the user to the settings
    // Full string for reference: We now load images by default and block senders from tracking you. This can be changed in the settings.
    const settingsLink = (
        <SettingsLink path="/email-privacy" app={APPS.PROTONMAIL} key="load-content-settings-link">{c(
            'Link to settings'
        ).t`settings`}</SettingsLink>
    );

    // translator: The variable "settingsLink" is a link used to redirect the user to the settings. It should contain "settings"
    // Full string for reference: We now load images by default and block senders from tracking you. This can be changed in the settings.
    const text = c('Spotlight')
        .jt`We now load images by default and block senders from tracking you. This can be changed in the ${settingsLink}.`;

    return (
        <Spotlight
            originalPlacement="bottom-end"
            show={show}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            style={{ maxWidth: '25rem' }}
            content={
                <>
                    <div className="flex flex-nowrap my-2">
                        <div className="shrink-0 mr-4">
                            <img src={loadContentImg} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
                        </div>
                        <div>
                            <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`Email tracking protection`}</p>
                            <p className="m-0">{text}</p>
                        </div>
                    </div>
                </>
            }
        >
            {children}
        </Spotlight>
    );
};

export default LoadContentSpotlight;

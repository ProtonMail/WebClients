import { ReactElement, RefObject } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight } from '@proton/components/components';
import { APPS } from '@proton/shared/lib/constants';
import loadContentImg from '@proton/styles/assets/img/illustrations/spotlight-load-content.svg';

interface Props {
    children: ReactElement;
    anchorRef: RefObject<HTMLElement>;
    show: boolean;
    onDisplayed: () => void;
}

const LoadContentSpotlight = ({ children, anchorRef, show, onDisplayed }: Props) => {
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
                    <div className="flex flex-nowrap mt0-5 mb0-5">
                        <div className="flex-item-noshrink mr1">
                            <img src={loadContentImg} className="w4e" />
                        </div>
                        <div>
                            <p className="mt0 mb0-5 text-bold">{c('Spotlight').t`Email tracking protection`}</p>
                            <p className="m0">{text}</p>
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

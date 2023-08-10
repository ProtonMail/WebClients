import { ReactNode } from 'react';

import { c } from 'ttag';

import { SettingsLink, Spotlight } from '@proton/components/components';
import { APPS } from '@proton/shared/lib/constants';

interface Props {
    children: ReactNode;
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
}

const AlmostAllMailSpotlight = ({ children, show, onDisplayed, onClose }: Props) => {
    const settingsLink = (
        <SettingsLink key="to-messages-settings" app={APPS.PROTONACCOUNT} path="/general#messages">{c('Spotlight')
            .t`Change setting`}</SettingsLink>
    );

    return (
        <Spotlight
            show={show}
            onDisplayed={onDisplayed}
            onClose={onClose}
            originalPlacement="bottom-start"
            type="new"
            className="ml-4"
            content={
                <p className="m-0">{
                    // translator: `Almost all mail` is a new true-by-default setting that enables to exclude Trash/Spam message from `All Mail` location
                    c('Spotlight')
                        .jt`Spam and Trash emails are now automatically excluded from All Mail. ${settingsLink}`
                }</p>
            }
        >
            {children}
        </Spotlight>
    );
};

export default AlmostAllMailSpotlight;

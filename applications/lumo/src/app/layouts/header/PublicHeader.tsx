import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { SettingsLink } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { useIsGuest } from '../../providers/IsGuestProvider';
import { getIsMobileDevice } from '../../util/device';

// TODO: Add icon for either button for mobile view

export const PublicHeader = () => {
    const isGuest = useIsGuest();
    const isMobileDevice = getIsMobileDevice();

    return (
        // <HeaderWrapper>
        <header className="hidden md:flex flex-nowrap justify-end items-center gap-2 p-3">
            {isGuest && !isMobileDevice && (
                <li className="ml-auto hidden lg:inline-flex no-print">
                    <Href href="https://proton.me/mail" className="inline-flex p-3 color-weak text-no-decoration">
                        {c('collider_2025: Top nav link').t`Try ${MAIL_APP_NAME}`}
                    </Href>
                </li>
            )}
            <ButtonLike as={SettingsLink} path="/signup" shape="solid">
                {c('collider_2025: Link').t`Create a free account`}
            </ButtonLike>
            <ButtonLike as={SettingsLink} path="" shape="solid" color="weak">{c('collider_2025: Link')
                .t`Sign in`}</ButtonLike>
        </header>
        // </HeaderWrapper>
    );
};

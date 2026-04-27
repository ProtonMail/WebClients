import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { CreateFreeAccountButton } from '../../components/Guest/CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../../components/Guest/SignInLink';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { getIsMobileDevice } from '../../util/device';

// TODO: Add icon for either button for mobile view

export const PublicHeader = () => {
    const isGuest = useIsGuest();
    const isMobileDevice = getIsMobileDevice();

    return (
        <header className="hidden md:flex flex-nowrap justify-end items-center gap-2 p-3">
            {isGuest && !isMobileDevice && (
                <Href href="https://proton.me/mail" className="inline-flex p-3 color-weak text-no-decoration">
                    {c('collider_2025: Top nav link').t`Try ${MAIL_APP_NAME}`}
                </Href>
            )}
            <CreateFreeAccountButton />
            <SignInButton color="weak" shape="solid" />
        </header>
    );
};

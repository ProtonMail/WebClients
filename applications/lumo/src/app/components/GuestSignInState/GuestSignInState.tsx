import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';
import { IcLock } from '@proton/icons/icons/IcLock';

import './GuestSignInState.scss';

interface GuestSignInStateProps {
    image: string;
    imageAlt?: string;
    title: string;
    description: string;
}

/**
 * Full-page centred state shown to unauthenticated (guest) users.
 * Displays a feature illustration, configurable title and description,
 * and consistent "Create a free account" / "Sign in" CTAs.
 */
export const GuestSignInState = ({ image, imageAlt = '', title, description }: GuestSignInStateProps) => {
    return (
        <div className="guest-signin-state">
            <div className="guest-signin-state__icon">
                <img src={image} alt={imageAlt} height={180} />
            </div>

            <h2 className="guest-signin-state__title">{title}</h2>

            <p className="guest-signin-state__description">{description}</p>

            <div className="guest-signin-state__actions">
                <ButtonLike as={SettingsLink} color="norm" shape="solid" path="/signup" className="w-full">
                    {c('collider_2025:Button').t`Create a free account`}
                </ButtonLike>
                <ButtonLike as={SettingsLink} path="" shape="outline" color="weak" className="w-full">
                    {c('collider_2025:Button').t`Sign in`}
                </ButtonLike>
            </div>

            <p className="guest-signin-state__footer">
                <IcLock size={3} className="mr-1" />
                {c('collider_2025:Info').t`Your information is zero-access encrypted`}
            </p>
        </div>
    );
};

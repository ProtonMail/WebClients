import { c } from 'ttag';

import { IcLock } from '@proton/icons/icons/IcLock';

import { CreateFreeAccountButton } from '../CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../SignInLink';

import './GuestSignInState.scss';

interface GuestSignInStateProps {
    image?: string;
    imageAlt?: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
}

/**
 * Full-page centred state shown to unauthenticated (guest) users.
 * Displays a feature illustration, configurable title and description,
 * and consistent "Create a free account" / "Sign in" CTAs.
 */
export const GuestSignInState = ({ image, imageAlt = '', title, description, icon }: GuestSignInStateProps) => {
    return (
        <div className="guest-signin-state">
            <div className="guest-signin-state__icon">
                {image && <img src={image} alt={imageAlt} height={180} />}
                {icon && icon}
            </div>
            <h2 className="guest-signin-state__title">{title}</h2>

            <p className="guest-signin-state__description">{description}</p>

            <div className="guest-signin-state__actions">
                <CreateFreeAccountButton color="norm" shape="solid" className="w-full" />
                <SignInButton color="weak" shape="outline" className="w-full" />
            </div>

            <p className="guest-signin-state__footer">
                <IcLock size={3} className="mr-1" />
                {c('collider_2025:Info').t`Your information is zero-access encrypted`}
            </p>
        </div>
    );
};

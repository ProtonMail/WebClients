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
        <div className="guest-signin-state flex flex-column items-center justify-center text-center py-10 px-6">
            <div className="guest-signin-state__icon flex items-center justify-center mb-5">
                {image && <img src={image} alt={imageAlt} height={180} />}
                {icon && icon}
            </div>
            <h2 className="guest-signin-state__title text-semibold color-norm mt-0 mb-2 mx-0">{title}</h2>

            <p className="guest-signin-state__description color-weak m-0">{description}</p>

            <div className="guest-signin-state__actions flex flex-column items-center gap-2 mt-5 w-full">
                <CreateFreeAccountButton color="norm" shape="solid" className="w-full" />
                <SignInButton color="weak" shape="outline" className="w-full" />
            </div>

            <p className="guest-signin-state__footer flex items-center gap-1 mt-4 color-weak">
                <IcLock size={3} className="mr-1" />
                {c('collider_2025:Info').t`Your information is zero-access encrypted`}
            </p>
        </div>
    );
};

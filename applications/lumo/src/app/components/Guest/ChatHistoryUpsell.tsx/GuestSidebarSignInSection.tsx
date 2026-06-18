import { c } from 'ttag';

import { CreateFreeAccountButton } from '../CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../SignInLink';

import './GuestSidebarSignInSection.scss';

// For unathenticated guest users - enhanced sign-in section
export const GuestSidebarSignInSection = () => {
    return (
        <div className="guest-sidebar-signin-section rounded-xl ml-0 md:ml-2 mr-2 mb-0 mx-auto overflow-y-auto bg-norm">
            <div className="rounded-sm flex flex-column flex-nowrap gap-3 p-4">
                <h4 className="text-rg text-semibold">{c('collider_2025: Guest Signin')
                    .t`Get responses tailored to you`}</h4>

                <p className="m-0 color-hint shrink-0">
                    {c('collider_2025: Guest Signin')
                        .t`Sign in to get answers based on saved chats and projects, plus create images, and upload files.`}
                </p>
                <CreateFreeAccountButton color="norm" shape="solid" />
                <SignInButton color="weak" shape="solid" />
            </div>
        </div>
    );
};

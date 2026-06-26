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
                    .t`Save your chat history`}</h4>

                <p className="m-0 color-hint shrink-0">
                    {c('collider_2025: Guest Signin')
                        .t`Create a free account to keep your chats, organize them in projects, and get higher usage limits.`}
                </p>
                <CreateFreeAccountButton color="norm" shape="solid" />
                <SignInButton color="weak" shape="solid" />
            </div>
        </div>
    );
};

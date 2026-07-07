import { c } from 'ttag';

import { SidebarUpsellSection } from '../../../layouts/sidebar/components/SidebarUpsellSection';
import { CreateFreeAccountButton } from '../CreateFreeAccountLink/CreateFreeAccountLink';
import { SignInButton } from '../SignInLink';

// For unathenticated guest users - enhanced sign-in section
export const GuestSidebarSignInSection = () => {
    return (
        <SidebarUpsellSection
            upsellId="guest-sign-in"
            title={c('collider_2025: Guest Signin').t`Save your chat history`}
            description={c('collider_2025: Guest Signin')
                .t`Create a free account to keep your chats, organize them in projects, and get higher usage limits.`}
        >
            <CreateFreeAccountButton color="norm" shape="solid" />
            <SignInButton color="weak" shape="solid" />
        </SidebarUpsellSection>
    );
};

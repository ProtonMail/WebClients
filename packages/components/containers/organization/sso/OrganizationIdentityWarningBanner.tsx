import { c } from 'ttag';

import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import SettingsLink from '@proton/components/components/link/SettingsLink';

export const OrganizationIdentityWarningBanner = () => {
    const [organizationKey] = useOrganizationKey();

    if (!organizationKey || organizationKey.Key.SignatureAddress) {
        return null;
    }

    return (
        <div className="mb-8">
            <Banner
                variant="danger"
                action={
                    <ButtonLike
                        as={SettingsLink}
                        color="danger"
                        size="small"
                        key="set"
                        path="/organization-keys?action=set-organization-identity"
                    >{c('sso').t`Set identity`}</ButtonLike>
                }
            >
                {c('sso')
                    .jt`Single sign-on may not function correctly without an organization identity. Set an identity to ensure reliable authentication.`}
            </Banner>
        </div>
    );
};

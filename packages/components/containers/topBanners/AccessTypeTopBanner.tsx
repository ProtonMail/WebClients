import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import TopBanner from './TopBanner';

const MspAccessTopBanner = ({ username }: { username: string }) => {
    const [organization] = useOrganization();
    const organizationName = organization?.Name || '';
    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${username} for ${organizationName}.`}
        </TopBanner>
    );
};

const AccessTypeTopBanner = () => {
    const [user] = useUser();

    if (user.accessType === AccessType.Self) {
        return null;
    }

    const email = user.Email;
    const displayName = user.Name || user.DisplayName || email;
    const maybeEmail = email !== displayName ? `(${email})` : null;
    const username = [displayName, maybeEmail].filter(isTruthy).join(' ');

    if (user.accessType === AccessType.Msp) {
        return <MspAccessTopBanner username={username} />;
    }

    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${username}.`}
            {` `}
            {(() => {
                if (user.accessType === AccessType.EmergencyAccess) {
                    return (
                        <Href href={getKnowledgeBaseUrl('/emergency-access-settings')}>{c('Link').t`Learn more`}</Href>
                    );
                }
                if (user.accessType === AccessType.AdminAccess) {
                    return (
                        <Href href={getKnowledgeBaseUrl('/manage-public-users-organization')}>{c('Link')
                            .t`Learn more`}</Href>
                    );
                }
            })()}
        </TopBanner>
    );
};

export default AccessTypeTopBanner;

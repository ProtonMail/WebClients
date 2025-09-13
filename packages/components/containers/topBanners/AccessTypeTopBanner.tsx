import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import TopBanner from './TopBanner';

const AccessTypeTopBanner = () => {
    const [user] = useUser();

    if (user.accessType === AccessType.Self) {
        return null;
    }

    const email = user.Email;
    const displayName = user.Name || user.DisplayName || email;
    const maybeEmail = email !== displayName ? `(${email})` : null;
    const username = [displayName, maybeEmail].filter(isTruthy).join(' ');

    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${username}.`}
            {` `}
            {user.accessType === AccessType.EmergencyAccess ? (
                <Href href={getKnowledgeBaseUrl('/emergency-access-settings')}>{c('Link').t`Learn more`}</Href>
            ) : user.accessType === AccessType.AdminAccess ? (
                <Href href={getKnowledgeBaseUrl('/manage-public-users-organization')}>{c('Link').t`Learn more`}</Href>
            ) : null}
        </TopBanner>
    );
};

export default AccessTypeTopBanner;

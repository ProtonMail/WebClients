import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import TopBanner from './TopBanner';

const AccessTypeTopBanner = () => {
    const [user] = useUser();

    if (user.accessType === AccessType.Self) {
        return null;
    }

    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${user.Name} (${user.Email}).`}
            {` `}
            {user.accessType === AccessType.AdminAccess ? (
                <Href href={getKnowledgeBaseUrl('/manage-public-users-organization')}>{c('Link').t`Learn more`}</Href>
            ) : null}
        </TopBanner>
    );
};

export default AccessTypeTopBanner;

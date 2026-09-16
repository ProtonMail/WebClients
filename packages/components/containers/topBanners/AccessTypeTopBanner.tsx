import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { SessionAccessTypeFlag, selfAccessTypeMask } from '@proton/shared/lib/authentication/sessionAccessType';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import TopBanner from './TopBanner';

const SignedInAsTopBanner = ({ username, href }: { username: string; href: string }) => {
    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${username}.`}
            {` `}
            <Href href={href}>{c('Link').t`Learn more`}</Href>
        </TopBanner>
    );
};

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
    const { accessTypeMask } = user;

    if (accessTypeMask === selfAccessTypeMask) {
        return null;
    }

    const email = user.Email;
    const displayName = user.Name || user.DisplayName || email;
    const maybeEmail = email !== displayName ? `(${email})` : null;
    const username = [displayName, maybeEmail].filter(isTruthy).join(' ');

    // A session can hold several of these at once, so each flag gets its own banner rather than
    // only the one a collapsed access type would have kept
    return (
        <>
            {hasBit(accessTypeMask, SessionAccessTypeFlag.AdminAccess) && (
                <SignedInAsTopBanner
                    username={username}
                    href={getKnowledgeBaseUrl('/manage-public-users-organization')}
                />
            )}
            {hasBit(accessTypeMask, SessionAccessTypeFlag.DelegatedAccess) && (
                <SignedInAsTopBanner username={username} href={getKnowledgeBaseUrl('/emergency-access-settings')} />
            )}
            {hasBit(accessTypeMask, SessionAccessTypeFlag.OrgAccess) && <MspAccessTopBanner username={username} />}
        </>
    );
};

export default AccessTypeTopBanner;

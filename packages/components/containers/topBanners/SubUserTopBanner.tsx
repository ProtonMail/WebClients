import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useUser } from '../../hooks';
import TopBanner from './TopBanner';

const SubUserTopBanner = () => {
    const [user] = useUser();

    if (!user.isSubUser) {
        return null;
    }

    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${user.Name} (${user.Email}).`}
            {` `}
            <Href url={getKnowledgeBaseUrl('/manage-public-users-organization')}>{c('Link').t`Learn more`}</Href>
        </TopBanner>
    );
};

export default SubUserTopBanner;

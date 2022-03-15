import { c } from 'ttag';

import { useUser } from '../../hooks';
import TopBanner from './TopBanner';
import Href from '../../components/link/Href';

const SubUserTopBanner = () => {
    const [user] = useUser();

    if (!user.isSubUser) {
        return null;
    }

    return (
        <TopBanner className="bg-info">
            {c('Info').t`You are currently signed in as ${user.Name} (${user.Email}).`}
            {` `}
            <Href url="https://protonmail.com/support/knowledge-base/manage-public-users-organization/">{c('Link')
                .t`Learn more`}</Href>
        </TopBanner>
    );
};

export default SubUserTopBanner;

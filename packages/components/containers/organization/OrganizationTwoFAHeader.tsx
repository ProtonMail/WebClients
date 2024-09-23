import { c, msgid } from 'ttag';

import { Card } from '@proton/atoms';
import { useMembers } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import type { Organization } from '@proton/shared/lib/interfaces';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAHeader = ({ organization }: Props) => {
    const [members] = useMembers();

    if (!organization || !members) {
        return <Loader />;
    }

    const twoFAMembers = members.filter((member) => member['2faStatus'] !== 0) || [];

    // translator: the variables here are numbers, e.g. "2/4 of your organization members use two-factor authentication."
    const cardContent = c('Loading info').ngettext(
        msgid`${twoFAMembers.length}/${members.length} of your organization member use two-factor authentication.`,
        `${twoFAMembers.length}/${members.length} of your organization members use two-factor authentication.`,
        members.length
    );

    return (
        <Card rounded background bordered={false} className="max-w-custom" style={{ '--max-w-custom': '43em' }}>
            {cardContent}
        </Card>
    );
};

export default OrganizationTwoFAHeader;

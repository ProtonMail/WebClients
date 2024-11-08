import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { Card } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAHeader = ({ organization }: Props) => {
    const [members] = useMembers();
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';

    if (!organization || !members) {
        return <Loader />;
    }

    const twoFAMembers = members.filter((member) => member['2faStatus'] !== 0) || [];

    // translator: the variables here are numbers, e.g. "2/4 of your organization members use two-factor authentication."
    const cardContentB2B = c('Loading info').ngettext(
        msgid`${twoFAMembers.length}/${members.length} of your organization member use two-factor authentication.`,
        `${twoFAMembers.length}/${members.length} of your organization members use two-factor authentication.`,
        members.length
    );

    // translator: the variables here are numbers, e.g. "2/4 of your family members use two-factor authentication."
    const cardContentFamily = c('Loading info').ngettext(
        msgid`${twoFAMembers.length}/${members.length} of your organization member use two-factor authentication.`,
        `${twoFAMembers.length}/${members.length} of your family members use two-factor authentication.`,
        members.length
    );

    const cardContent = hasFamilyOrg ? cardContentFamily : cardContentB2B;

    return (
        <Card rounded background bordered={false} className="max-w-custom" style={{ '--max-w-custom': '43em' }}>
            {cardContent}
        </Card>
    );
};

export default OrganizationTwoFAHeader;

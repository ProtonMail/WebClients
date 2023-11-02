import { c, msgid } from 'ttag';

import { Card } from '@proton/atoms';
import { Alert, useMembers } from '@proton/components';
import { Organization } from '@proton/shared/lib/interfaces';

import { Loader } from '../../components';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAHeader = ({ organization }: Props) => {
    const [members, loadingMembers] = useMembers();

    if (!organization || loadingMembers) {
        return <Loader />;
    }

    // Organization is not setup.
    if (!organization?.HasKeys) {
        return <Alert className="mb-1" type="warning">{c('Info').t`Multi-user support not enabled.`}</Alert>;
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

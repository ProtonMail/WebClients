import { c, msgid } from 'ttag';

import { useMembers } from '@proton/account/members/hooks';
import { Card } from '@proton/atoms/Card/Card';
import Loader from '@proton/components/components/loader/Loader';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

import { getTwoFAMemberStatistics } from './organizationTwoFAHelper';

interface Props {
    organization?: Organization;
}

const OrganizationTwoFAHeader = ({ organization }: Props) => {
    const [members] = useMembers();
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';

    if (!organization || !members) {
        return <Loader />;
    }

    const { canHaveTwoFAMembersLength, hasTwoFAMembersLength, hasSSOMembers } = getTwoFAMemberStatistics(members);

    const cardContent = (() => {
        if (hasSSOMembers) {
            return c('Info').ngettext(
                msgid`${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your non-SSO members use two-factor authentication to sign in to your organization.`,
                `${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your non-SSO members use two-factor authentication to sign in to your organization.`,
                canHaveTwoFAMembersLength
            );
        }

        if (hasFamilyOrg) {
            // translator: the variables here are numbers, e.g. "2/4 of your family members use two-factor authentication."
            return c('Info').ngettext(
                msgid`${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your family members use two-factor authentication.`,
                `${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your family members use two-factor authentication.`,
                canHaveTwoFAMembersLength
            );
        }

        // translator: the variables here are numbers, e.g. "2/4 of your members use two-factor authentication to sign in to your organization."
        return c('Info').ngettext(
            msgid`${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your members use two-factor authentication to sign in to your organization.`,
            `${hasTwoFAMembersLength}/${canHaveTwoFAMembersLength} of your members use two-factor authentication to sign in to your organization.`,
            canHaveTwoFAMembersLength
        );
    })();

    return (
        <Card rounded background bordered={false} className="max-w-custom" style={{ '--max-w-custom': '43em' }}>
            {cardContent}
        </Card>
    );
};

export default OrganizationTwoFAHeader;

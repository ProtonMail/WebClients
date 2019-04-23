import { c } from 'ttag';
import PropTypes from 'prop-types';
import { USER_ROLES } from 'proton-shared/lib/constants';

const SUPER_ADMIN_ROLE = 'superman';

const ROLES = {
    [USER_ROLES.ADMIN_ROLE]: c('User role').t`Admin`,
    [USER_ROLES.MEMBER_ROLE]: c('User role').t`Member`,
    [SUPER_ADMIN_ROLE]: c('User role').t`Primary admin`
};

const MemberRole = ({ member }) => {
    return ROLES[member.Subscriber ? SUPER_ADMIN_ROLE : member.Role];
};

MemberRole.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberRole;

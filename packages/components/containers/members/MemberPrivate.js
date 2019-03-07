import { c } from 'ttag';
import PropTypes from 'prop-types';

const PRIVATE = {
    0: c('Status for member').t`No`,
    1: c('Status for member').t`Yes`
};

const MemberPrivate = ({ member }) => {
    return PRIVATE[member.Private];
};

MemberPrivate.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberPrivate;

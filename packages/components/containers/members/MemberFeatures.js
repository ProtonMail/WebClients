import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const MemberFeatures = ({ member }) => {
    const { MaxSpace, MaxVPN } = member;

    return (
        <>
            <Icon name="alias" /> {humanSize(MaxSpace, 'GB')}
            <Icon name="protonvpn" /> {MaxVPN}
        </>
    );
};

MemberFeatures.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberFeatures;

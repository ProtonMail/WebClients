import React from 'react';
import PropTypes from 'prop-types';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Icon } from '../../components';

const MemberFeatures = ({ member }) => {
    const { UsedSpace, MaxSpace, MaxVPN } = member;

    return (
        <>
            <div>
                <Icon name="user-storage" /> {humanSize(UsedSpace, 'GB')} / {humanSize(MaxSpace, 'GB')}
            </div>
            <div>
                <Icon name="protonvpn" /> {MaxVPN}
            </div>
        </>
    );
};

MemberFeatures.propTypes = {
    member: PropTypes.object.isRequired,
};

export default MemberFeatures;

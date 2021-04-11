import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { Icon } from '../../components';

const MemberFeatures = ({ member }) => {
    const { UsedSpace, MaxSpace, MaxVPN } = member;

    const connectionsPluralized = `${c('Max VPN Connections').ngettext(msgid`Connection`, `Connections`, MaxVPN)}`;

    return (
        <>
            <div className="mb0-5">
                <Icon name="user-storage" /> {humanSize(UsedSpace, 'GB')} / {humanSize(MaxSpace, 'GB')}
            </div>
            <div>
                <Icon name="protonvpn" /> {MaxVPN} {c('Feature').t`VPN ${connectionsPluralized}`}
            </div>
        </>
    );
};

MemberFeatures.propTypes = {
    member: PropTypes.object.isRequired,
};

export default MemberFeatures;

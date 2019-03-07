import React from 'react';
import PropTypes from 'prop-types';
import { ngettext, msgid } from 'ttag';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const MemberOptions = ({ member }) => {
    const formatSize = ({ UsedSpace, MaxSpace }) =>
        `${humanSize(UsedSpace, 'GB', true)} / ${humanSize(MaxSpace, 'GB')}`;

    const formatVPN = ({ MaxVPN }) => ngettext(msgid`${MaxVPN} VPN connection`, `${MaxVPN} VPN connections`, MaxVPN);

    return (
        <>
            <div>{formatSize(member)}</div>
            <div>{formatVPN(member)}</div>
        </>
    );
};

MemberOptions.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberOptions;

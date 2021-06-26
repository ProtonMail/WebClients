import React from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { DOMAIN_STATE, VERIFY_STATE, MX_STATE, SPF_STATE, DKIM_STATE, DMARC_STATE } from 'proton-shared/lib/constants';
import { Badge } from '../../components';

const VERIFY_TYPES = {
    [VERIFY_STATE.VERIFY_STATE_DEFAULT]: 'origin',
    [VERIFY_STATE.VERIFY_STATE_EXIST]: 'error',
    [VERIFY_STATE.VERIFY_STATE_GOOD]: 'success',
};

const MX_TYPES = {
    [MX_STATE.MX_STATE_DEFAULT]: 'origin',
    [MX_STATE.MX_STATE_NO_US]: 'error',
    [MX_STATE.MX_STATE_INC_US]: 'error',
    [MX_STATE.MX_STATE_GOOD]: 'success',
};

const SPF_TYPES = {
    [SPF_STATE.SPF_STATE_DEFAULT]: 'origin',
    [SPF_STATE.SPF_STATE_ONE]: 'error',
    [SPF_STATE.SPF_STATE_MULT]: 'error',
    [SPF_STATE.SPF_STATE_GOOD]: 'success',
};

const DKIM_TYPES = {
    [DKIM_STATE.DKIM_STATE_DEFAULT]: 'origin',
    [DKIM_STATE.DKIM_STATE_ERROR]: 'error',
    [DKIM_STATE.DKIM_STATE_GOOD]: 'success',
    [DKIM_STATE.DKIM_STATE_WARNING]: 'warning',
};

const DMARC_TYPES = {
    [DMARC_STATE.DMARC_STATE_DEFAULT]: 'origin',
    [DMARC_STATE.DMARC_STATE_ONE]: 'error',
    [DMARC_STATE.DMARC_STATE_MULT]: 'error',
    [DMARC_STATE.DMARC_STATE_GOOD]: 'success',
};

const DomainStatus = ({ domain, domainAddresses }) => {
    const n = domainAddresses.length;

    const catchAllEnabled = domainAddresses.some((address) => address.CatchAll);

    const badges = [
        { text: c('Domain label').t`Verified`, type: VERIFY_TYPES[domain.VerifyState] },
        {
            text: c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n),
            type: domain.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE && n ? 'success' : 'error',
        },
        { text: 'MX', type: MX_TYPES[domain.MxState] },
        { text: 'SPF', type: SPF_TYPES[domain.SpfState] },
        { text: 'DKIM', type: DKIM_TYPES[domain.DKIM.State] },
        { text: 'DMARC', type: DMARC_TYPES[domain.DmarcState] },
        { text: 'CATCH-ALL', type: catchAllEnabled ? 'success' : 'origin' },
    ];

    return (
        <>
            {badges.map(({ text, type }, index) => (
                <Badge key={index.toString()} type={type}>
                    {text}
                </Badge>
            ))}
        </>
    );
};

DomainStatus.propTypes = {
    domain: PropTypes.object.isRequired,
    domainAddresses: PropTypes.array.isRequired,
};

export default DomainStatus;

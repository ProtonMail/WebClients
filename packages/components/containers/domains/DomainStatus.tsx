import { c, msgid } from 'ttag';

import { Badge } from '@proton/components';
import type { BadgeType } from '@proton/components/components/badge/Badge';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';
import {
    DKIM_STATE,
    DMARC_STATE,
    DOMAIN_STATE,
    MX_STATE,
    SPF_STATE,
    VERIFY_STATE,
} from '@proton/shared/lib/interfaces';

const VERIFY_TYPES = {
    [VERIFY_STATE.VERIFY_STATE_DEFAULT]: 'origin',
    [VERIFY_STATE.VERIFY_STATE_EXIST]: 'error',
    [VERIFY_STATE.VERIFY_STATE_GOOD]: 'success',
} satisfies { [key in VERIFY_STATE]: BadgeType };

const MX_TYPES = {
    [MX_STATE.MX_STATE_DEFAULT]: 'origin',
    [MX_STATE.MX_STATE_NO_US]: 'error',
    [MX_STATE.MX_STATE_INC_US]: 'error',
    [MX_STATE.MX_STATE_GOOD]: 'success',
} satisfies { [key in MX_STATE]: BadgeType };

const SPF_TYPES = {
    [SPF_STATE.SPF_STATE_DEFAULT]: 'origin',
    [SPF_STATE.SPF_STATE_ONE]: 'error',
    [SPF_STATE.SPF_STATE_MULT]: 'error',
    [SPF_STATE.SPF_STATE_GOOD]: 'success',
} satisfies { [key in SPF_STATE]: BadgeType };

const DKIM_TYPES = {
    [DKIM_STATE.DKIM_STATE_DEFAULT]: 'origin',
    [DKIM_STATE.DKIM_STATE_ERROR]: 'error',
    [DKIM_STATE.DKIM_STATE_GOOD]: 'success',
    [DKIM_STATE.DKIM_STATE_WARNING]: 'warning',
    [DKIM_STATE.DKIM_STATE_DELEGATED]: 'origin',
} satisfies { [key in DKIM_STATE]: BadgeType };

const DMARC_TYPES = {
    [DMARC_STATE.DMARC_STATE_DEFAULT]: 'origin',
    [DMARC_STATE.DMARC_STATE_ONE]: 'error',
    [DMARC_STATE.DMARC_STATE_MULT]: 'error',
    [DMARC_STATE.DMARC_STATE_GOOD]: 'success',
    [DMARC_STATE.DMARC_STATE_RELAXED]: 'origin',
} satisfies { [key in DMARC_STATE]: BadgeType };

interface Props {
    domain: Domain;
    domainAddresses: DomainAddress[];
}

const DomainStatus = ({ domain, domainAddresses }: Props) => {
    const n = domainAddresses.length;

    const catchAllEnabled = domainAddresses.some((address) => address.CatchAll);

    const badges: { text: string; type: BadgeType }[] = [
        { text: c('Domain label').t`Verified`, type: VERIFY_TYPES[domain.VerifyState] },
        {
            text: c('Info').ngettext(msgid`${n} address`, `${n} addresses`, n),
            type: domain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED && n ? 'success' : 'error',
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
                <Badge key={index.toString()} type={type} className="mb-1 mr-1">
                    {text}
                </Badge>
            ))}
        </>
    );
};

export default DomainStatus;

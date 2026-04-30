import { type FC, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Card } from '@proton/atoms/Card/Card';
import { Badge } from '@proton/components/components/badge/Badge';
import type { BadgeType } from '@proton/components/components/badge/Badge';
import { IcKey } from '@proton/icons/icons/IcKey';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { epochHoursFromNow } from '@proton/pass/utils/time/epoch';
import { epochToDate } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

import type { TokenStatus } from './helpers';
import { getTokenStatus } from './helpers';

type Derived = {
    statusBadge: { label: string; type: BadgeType };
    expiryLabel: string;
    isExpired: boolean;
    createdDate: string;
};

type Props = {
    token: PersonalAccessToken;
    onDelete: (token: PersonalAccessToken) => void;
    onManageAccess: (token: PersonalAccessToken) => void;
    onViewActions: (token: PersonalAccessToken) => void;
};

const getStatusBadge = (status: TokenStatus): { label: string; type: BadgeType } => {
    switch (status) {
        case 'expired':
            return { label: c('pass_2026: Status').t`Expired`, type: 'error' };
        case 'expiring':
            return { label: c('pass_2026: Status').t`Expiring soon`, type: 'warning' };
        default:
            return { label: c('pass_2026: Status').t`Active`, type: 'success' };
    }
};

const getExpiryLabel = (expireTime: number): string => {
    const hours = epochHoursFromNow(expireTime);
    if (hours < 0) {
        const abs = Math.abs(hours);
        return c('pass_2026: Info').ngettext(msgid`Expired ${abs} hour ago`, `Expired ${abs} hours ago`, abs);
    }
    if (hours === 0) return c('pass_2026: Info').t`Expires in less than an hour`;
    return c('pass_2026: Info').ngettext(msgid`Expires in ${hours} hour`, `Expires in ${hours} hours`, hours);
};

export const AccessTokenCard: FC<Props> = ({ token, onDelete, onManageAccess, onViewActions }) => {
    const { statusBadge, expiryLabel, isExpired, createdDate } = useMemo<Derived>(() => {
        const status = getTokenStatus(token.ExpireTime);
        return {
            statusBadge: getStatusBadge(status),
            expiryLabel: getExpiryLabel(token.ExpireTime),
            isExpired: status === 'expired',
            createdDate: epochToDate(token.CreateTime),
        };
    }, [token.ExpireTime, token.CreateTime]);

    return (
        <Card rounded className="flex items-center gap-3 p-4 border-weak" background={false}>
            <div
                className={clsx('flex items-center justify-center rounded bg-weak shrink-0', isExpired && 'opacity-70')}
                style={{ width: '2.5rem', height: '2.5rem' }}
            >
                <IcKey size={5} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <strong className={clsx('text-ellipsis', isExpired && 'color-weak')}>{token.Name}</strong>
                    <Badge type={statusBadge.type} className="m-0">
                        {statusBadge.label}
                    </Badge>
                    {token.Flags?.PassAgent && (
                        <Badge type="info" className="m-0">
                            {c('pass_2026: Status').t`Agent`}
                        </Badge>
                    )}
                </div>
                <div className="text-sm color-weak">
                    {expiryLabel}
                    <span className="mx-2">·</span>
                    {c('pass_2026: Info').t`Created ${createdDate}`}
                </div>
            </div>

            <QuickActionsDropdown
                icon="three-dots-vertical"
                color="weak"
                shape="ghost"
                size="small"
                pill={false}
                originalPlacement="bottom-end"
            >
                <DropdownMenuButton
                    label={c('pass_2026: Action').t`Manage vault access`}
                    icon="pass-all-vaults"
                    onClick={() => onManageAccess(token)}
                />
                {token.Flags?.PassAgent && (
                    <DropdownMenuButton
                        label={c('pass_2026: Action').t`View agent activity`}
                        icon="clock"
                        onClick={() => onViewActions(token)}
                    />
                )}
                <DropdownMenuButton label={c('Action').t`Delete`} icon="trash" danger onClick={() => onDelete(token)} />
            </QuickActionsDropdown>
        </Card>
    );
};

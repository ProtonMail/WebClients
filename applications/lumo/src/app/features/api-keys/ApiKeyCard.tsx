import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcKey } from '@proton/icons/icons/IcKey';

import type { TokenUsageState } from '../../hooks/usePersonalAccessTokenUsage';
import type { PersonalAccessToken } from '../../remote/personalAccessToken';
import { ApiKeyUsageExpanded, UsageSparklineCompact } from './ApiKeyUsageCharts';
import {
    formatDate,
    getDaysRemaining,
    getTokenStatus,
    type TokenStatus,
} from './apiKeysHelpers';

const StatusBadge = ({ status }: { status: TokenStatus }) => {
    const labels: Record<TokenStatus, string> = {
        active: c('collider_2025: Status').t`Active`,
        expiring: c('collider_2025: Status').t`Expiring soon`,
        expired: c('collider_2025: Status').t`Expired`,
    };
    return <span className={`api-keys-status api-keys-status--${status}`}>{labels[status]}</span>;
};

export const ApiKeyCard = ({
    token,
    usage,
    onDelete,
    isDeleting,
}: {
    token: PersonalAccessToken;
    usage: TokenUsageState;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}) => {
    const [expanded, setExpanded] = useState(false);
    const status = getTokenStatus(token.ExpireTime);
    const daysLeft = getDaysRemaining(token.ExpireTime);

    const expiryLabel =
        status === 'expired'
            ? c('collider_2025: Info').t`Expired ` + formatDate(token.ExpireTime)
            : daysLeft === 1
              ? c('collider_2025: Info').t`Expires tomorrow`
              : c('collider_2025: Info').t`Expires ` + formatDate(token.ExpireTime);

    const toggleExpanded = () => setExpanded((v) => !v);

    return (
        <div className={clsx('api-keys-card-wrap', expanded && 'api-keys-card-wrap--expanded')}>
            <div
                className={clsx(
                    'api-keys-card',
                    status === 'expired' && 'api-keys-card--expired',
                    expanded && 'api-keys-card--open'
                )}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={toggleExpanded}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpanded();
                    }
                }}
            >
                <div className="api-keys-card-icon">
                    <IcKey size={4} />
                </div>

                <div className="api-keys-card-body">
                    <div className="api-keys-card-name">
                        <span>{token.Name}</span>
                        <StatusBadge status={status} />
                    </div>
                    <div className="api-keys-card-meta">{expiryLabel}</div>
                </div>

                <UsageSparklineCompact usage={usage} />

                <div className="api-keys-card-actions">
                    <Tooltip title={c('Action').t`Delete key`}>
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            color="danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(token.PersonalAccessTokenID);
                            }}
                            loading={isDeleting}
                            disabled={isDeleting}
                            aria-label={c('Action').t`Delete ${token.Name}`}
                        >
                            <IcTrash size={4} />
                        </Button>
                    </Tooltip>
                </div>

                <span className={clsx('api-keys-card-chevron', expanded && 'is-open')} aria-hidden>
                    <IcChevronDown size={4} />
                </span>
            </div>
            {expanded && (
                <div className="api-keys-card-expanded-shell">
                    <ApiKeyUsageExpanded usage={usage} />
                </div>
            )}
        </div>
    );
};

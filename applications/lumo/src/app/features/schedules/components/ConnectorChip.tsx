import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { getConnectorStatusLabel } from './utils/connectors';

import './ConnectorChip.scss';

interface ConnectorChipProps {
    className?: string;
    connector: DesktopConnector;
    onRemove?: () => void;
    unavailable?: boolean;
    warning?: boolean;
}

export const ConnectorIcon = ({
    className,
    icon,
    size = 16,
    unavailable = false,
    warning = false,
}: {
    className?: string;
    icon?: string | null;
    size?: number;
    unavailable?: boolean;
    warning?: boolean;
}) =>
    warning ? (
        <LumoIcon
            aria-hidden
            className={className}
            color="var(--signal-warning-major-2)"
            name="CircleAlert"
            size={size}
            strokeWidth={2.5}
        />
    ) : unavailable ? (
        <LumoIcon
            aria-hidden
            className={className}
            color="var(--signal-danger-major-2)"
            name="CircleSlash"
            size={size}
            strokeWidth={2.5}
        />
    ) : icon ? (
        <img alt="" className={clsx('shrink-0', className)} height={size} src={icon} width={size} />
    ) : (
        <LumoIcon aria-hidden className={className} name="Blocks" size={size} />
    );

export const ConnectorChip = ({ connector, onRemove, unavailable, warning }: ConnectorChipProps) => {
    const label = connector.display_name;
    const statusLabel = getConnectorStatusLabel(connector);
    const statusAccessibleLabel = getConnectorStatusLabel(connector, { a11y: true });

    return (
        <span
            className={clsx(
                'connector-chip',
                warning && 'connector-chip--warning',
                unavailable && 'connector-chip--unavailable',
                'relative inline-flex flex-nowrap shrink-0 items-center gap-1.5 px-2 pr-1.5 border rounded'
            )}
        >
            <Tooltip openDelay={300} title={unavailable || warning ? statusLabel : undefined}>
                <span className="inline-flex flex-nowrap shrink-0 items-center gap-1.5">
                    <ConnectorIcon
                        className="connector-chip__icon"
                        icon={connector.icon}
                        size={14}
                        unavailable={unavailable}
                        warning={warning}
                    />
                    <span className="connector-chip__label relative">{label}</span>
                </span>
            </Tooltip>
            {(unavailable || warning) && (
                <span className="sr-only">{
                    // translator: Accessibility label for the connector's status. ${statusLabel} is the connector's status label.
                    c('collider_2025:Info').t`Status: ${statusAccessibleLabel}`
                }</span>
            )}
            {onRemove && (
                <Button
                    aria-label={
                        // translator: Accessibility label for the remove button to remove a Connector (bridge to external systems/tools) from a schedule. ${label} is the connector's display name.
                        c('collider_2025:Action').t`Remove ${label}`
                    }
                    className="connector-chip__remove inline-flex shrink-0 items-center justify-center p-0 border border-transparent rounded-sm"
                    icon
                    increasedClickArea
                    onClick={onRemove}
                    shape="ghost"
                    size="small"
                    type="button"
                >
                    <LumoIcon aria-hidden className="shrink-0" name="X" size={12} />
                </Button>
            )}
        </span>
    );
};

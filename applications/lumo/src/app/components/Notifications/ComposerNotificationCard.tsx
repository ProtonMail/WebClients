import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors';
import { IcCross } from '@proton/icons/icons/IcCross';

import './ComposerNotificationCard.scss';

export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface ComposerNotificationAction {
    label: string;
    onClick: () => void;
    color?: ThemeColorUnion;
    shape?: ButtonLikeShape;
}

export interface ComposerNotificationCardProps {
    /** Optional leading node (icon, avatar, illustration). */
    icon?: ReactNode;
    /** Primary headline. */
    title: ReactNode;
    /** Secondary body text. */
    description?: ReactNode;
    /**
     * Either a fully custom node (e.g. a specialized button component) or a
     * simple action config that renders as a `Button`.
     */
    action?: ReactNode | ComposerNotificationAction;
    /** Show a cross button that calls `onDismiss`. */
    dismissible?: boolean;
    onDismiss?: () => void;
    /** Purely cosmetic and accessibility hint. */
    severity?: NotificationSeverity;
    /**
     * Apply the fade-out "hidden" state while keeping the node mounted so
     * transitions can animate. When `true`, the card is visually hidden and
     * non-interactive.
     */
    hidden?: boolean;
    className?: string;
    /**
     * Override the ARIA role. Defaults to `alert` for `error`, `status` otherwise.
     */
    role?: string;
}

const isActionConfig = (value: unknown): value is ComposerNotificationAction => {
    return !!value && typeof value === 'object' && 'label' in (value as any) && 'onClick' in (value as any);
};

const defaultRoleForSeverity = (severity: NotificationSeverity) => (severity === 'error' ? 'alert' : 'status');

/**
 * Shared inline notification card used above the composer and in other
 * composer-adjacent contexts. Renders an optional icon, title, description,
 * and an action/dismiss affordance. All behaviour (dismissing, visibility,
 * when to render) is controlled by the parent so this component can be
 * reused for transient warnings, persistent errors, or marketing CTAs.
 */
export const ComposerNotificationCard = ({
    icon,
    title,
    description,
    action,
    dismissible = false,
    onDismiss,
    severity = 'info',
    hidden = false,
    className,
    role,
}: ComposerNotificationCardProps) => {
    const renderedAction = (() => {
        if (!action) return null;
        if (isActionConfig(action)) {
            const defaultColor = severity === 'error' ? 'norm' : 'weak';
            const defaultShape = severity === 'error' ? 'solid' : 'outline';
            return (
                <Button
                    color={action.color ?? defaultColor}
                    shape={action.shape ?? defaultShape}
                    onClick={action.onClick}
                    className="shrink-0"
                >
                    {action.label}
                </Button>
            );
        }
        return action;
    })();

    return (
        <div
            className={clsx(
                'composer-notification-card',
                `composer-notification-card--${severity}`,
                'flex flex-row flex-nowrap items-center gap-2 w-full border border-weak rounded-xl p-4 justify-space-between mb-4 relative group-hover-opacity-container',
                hidden && 'composer-notification-card--hidden',
                className
            )}
            role={role ?? defaultRoleForSeverity(severity)}
        >
            <div className="flex flex-row flex-nowrap items-center gap-4 flex-1 min-w-0">
                {icon ? <div className="shrink-0 flex items-center">{icon}</div> : null}
                <div className="flex flex-column gap-1 min-w-0">
                    <span className="text-semibold">{title}</span>
                    {description ? <span className="text-sm color-weak">{description}</span> : null}
                </div>
            </div>

            {renderedAction}

            {dismissible && onDismiss && (
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="composer-notification-card-dismiss-button rounded-full border-weak shrink-0 self-start absolute top-0 right-0 bg-norm group-hover:opacity-100"
                    onClick={onDismiss}
                    title={c('Action').t`Dismiss`}
                >
                    <IcCross size={3} color="danger" alt={c('Action').t`Dismiss`} />
                </Button>
            )}
        </div>
    );
};

export default ComposerNotificationCard;

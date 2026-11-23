import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ButtonLikeShape } from '@proton/atoms/Button/ButtonLike';
import type { ThemeColorUnion } from '@proton/colors/types';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { canShowWebComposer } from '../../util/userAgent';
import { LumoIcon } from '../LumoIcon/LumoIcon';

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
    const { nativeComposer } = useLumoFlags();
    const usesNativeComposer = !canShowWebComposer(nativeComposer);

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
                'group-hover-opacity-container relative flex flex-nowrap justify-space-between gap-2 w-full mb-4 p-4 border radius-16',
                usesNativeComposer ? 'flex-column items-stretch' : 'flex-row items-center',
                hidden && 'composer-notification-card--hidden',
                className
            )}
            role={role ?? defaultRoleForSeverity(severity)}
        >
            <div
                className={clsx(
                    'flex flex-row flex-nowrap items-center gap-4 min-w-0',
                    usesNativeComposer ? 'shrink-0 w-full' : 'flex-1'
                )}
            >
                {icon ? <div className="shrink-0 flex items-center">{icon}</div> : null}
                <div className="flex flex-column gap-1 min-w-0">
                    <span className="lumo-title-small">{title}</span>
                    {description ? <span className="lumo-body-small lumo-color-glyph-mid">{description}</span> : null}
                </div>
            </div>

            {renderedAction}

            {dismissible && onDismiss && (
                <Button
                    icon
                    shape="ghost"
                    size="small"
                    className="composer-notification-card-dismiss-button absolute top-0 right-0 z-up shrink-0 self-start lumo-border radius-full lumo-bg-panel"
                    onClick={onDismiss}
                    title={c('Action').t`Dismiss`}
                >
                    <LumoIcon
                        name="X"
                        width={12}
                        height={12}
                        className="lumo-color-glyph-mid"
                        aria-label={c('Action').t`Dismiss`}
                    />
                </Button>
            )}
        </div>
    );
};

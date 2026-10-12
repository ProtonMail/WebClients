import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import type { ArtifactChipVisualState } from './artifactChipHelpers';
import { getArtifactChipIconPaneClass } from './artifactChipIconPane';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ArtifactType } from './parseArtifacts';

import './ArtifactChip.scss';

export const ArtifactChipIconPane = ({
    type,
    visualState = 'default',
}: {
    type: ArtifactType;
    visualState?: ArtifactChipVisualState;
}) => {
    const Icon = ARTIFACT_TYPE_CONFIG[type].icon;
    const paneTypeClass = getArtifactChipIconPaneClass(type);

    return (
        <span
            className={clsx(
                'artifact-chip-icon-pane',
                paneTypeClass,
                visualState === 'superseded' && 'artifact-chip-icon-pane--superseded'
            )}
            aria-hidden
        >
            <Icon size={4} />
        </span>
    );
};

interface ArtifactChipShellProps {
    type: ArtifactType;
    visualState?: ArtifactChipVisualState;
    title: ReactNode;
    subtitle?: ReactNode;
    trailing?: ReactNode;
    actions?: ReactNode;
    className?: string;
    /** Whole chip is one button (conversation thread). */
    onClick?: () => void;
    disabled?: boolean;
    /** Main label click without wrapping actions (Creations row + menu). */
    onMainClick?: () => void;
    mainDisabled?: boolean;
}

export const ArtifactChipShell = ({
    type,
    visualState = 'default',
    title,
    subtitle,
    trailing,
    actions,
    className,
    onClick,
    disabled = false,
    onMainClick,
    mainDisabled = false,
}: ArtifactChipShellProps) => {
    const isWholeChipInteractive = Boolean(onClick && !disabled);
    const isMainInteractive = Boolean(onMainClick && !mainDisabled);

    const chipClassName = clsx(
        'artifact-chip flex flex-row flex-nowrap items-stretch gap-0 overflow-hidden rounded-xl border border-weak bg-norm w-full max-w-full min-w-0 text-left',
        visualState === 'superseded' && 'artifact-chip--superseded',
        visualState === 'active' && 'artifact-chip--active',
        (isWholeChipInteractive || isMainInteractive) && 'cursor-pointer',
        className
    );

    const bodyContent = (
        <>
            <span
                className={clsx(
                    'text-sm text-ellipsis overflow-hidden whitespace-nowrap w-full',
                    visualState === 'superseded' ? 'color-hint' : 'color-norm text-semibold'
                )}
            >
                {title}
            </span>
            {subtitle ? <span className="w-full min-w-0">{subtitle}</span> : null}
        </>
    );

    const bodyLayoutClassName =
        'artifact-chip-body flex flex-column items-start justify-center gap-0.5 text-left py-3 pl-3 pr-2 min-w-0 flex-1';

    if (onClick) {
        // Icon + label share one button; actions stay siblings (nested buttons break layout).
        return (
            <div className={chipClassName}>
                <button
                    type="button"
                    className="artifact-chip-primary flex flex-row items-stretch gap-0"
                    onClick={onClick}
                    disabled={disabled}
                >
                    <ArtifactChipIconPane type={type} visualState={visualState} />
                    <div className={bodyLayoutClassName}>{bodyContent}</div>
                </button>
                {trailing ? <div className="artifact-chip-trailing pr-2">{trailing}</div> : null}
                {actions ? (
                    <div className="artifact-chip-actions pr-3 pl-1 flex flex-row items-center gap-1 shrink-0">
                        {actions}
                    </div>
                ) : null}
            </div>
        );
    }

    return (
        <div className={chipClassName}>
            <ArtifactChipIconPane type={type} visualState={visualState} />
            {onMainClick ? (
                <button
                    type="button"
                    className={clsx(
                        bodyLayoutClassName,
                        'artifact-chip-main py-3 pl-3 pr-2',
                        isMainInteractive && 'cursor-pointer'
                    )}
                    onClick={onMainClick}
                    disabled={mainDisabled}
                >
                    {bodyContent}
                </button>
            ) : (
                <div className={bodyLayoutClassName}>{bodyContent}</div>
            )}
            {trailing ? <div className="artifact-chip-trailing pr-2">{trailing}</div> : null}
            {actions ? (
                <div className="artifact-chip-actions pr-3 pl-1 flex flex-row items-center gap-1 shrink-0">
                    {actions}
                </div>
            ) : null}
        </div>
    );
};

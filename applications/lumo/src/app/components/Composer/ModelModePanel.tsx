import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import type { ModelTier, ResponseMode } from '../../providers/ModelTierProvider';
import { isLimitExhausted, isModelTierSelectable } from '../../services/usageLimitsStore';
import BasicUpgradeButton from '../../upsells/primitives/BasicUpgradeButton';
import { sendUpgradeButtonClickedEvent } from '../../util/telemetry';
import { LumoIcon } from '../LumoIcon/LumoIcon';

export type ModelModePanelLayout = 'dropdown' | 'sheet';

export interface ModelModeOption {
    tier: ModelTier;
    getLabel: () => string;
    getDescription: () => string;
    getRemaining?: () => number | undefined;
    getUnavailableReason?: () => 'high-load' | null;
    isDisabled?: () => boolean;
}

export interface ResponseModeOption {
    mode: ResponseMode;
    getLabel: () => string;
    getDescription: () => string;
}

export const getResponseModeOptions = (): ResponseModeOption[] => [
    {
        mode: 'fast',
        getLabel: () => c('collider_2025: Label').t`Fast mode`,
        getDescription: () => c('collider_2025: Description').t`Quick answers, less waiting`,
    },
    {
        mode: 'thinking',
        getLabel: () => c('collider_2025: Label').t`Thinking mode`,
        getDescription: () => c('collider_2025: Description').t`More thorough answers, but can take longer`,
    },
];

type ModelStatusBadgeVariant = 'exhausted' | 'high-load';

const getModelStatusBadge = (
    remaining: number | undefined,
    unavailableReason: 'high-load' | null
): { label: string; variant: ModelStatusBadgeVariant } | null => {
    if (unavailableReason === 'high-load') {
        return {
            label: c('collider_2025: Info').t`High load`,
            variant: 'high-load',
        };
    }

    if (remaining !== undefined && isLimitExhausted(remaining)) {
        return {
            label: c('collider_2025: Info').t`Ran out`,
            variant: 'exhausted',
        };
    }

    // if (shouldShowRemainingLimitIndicator(remaining) && remaining !== undefined && isLimitLow(remaining)) {
    //     return {
    //         label: c('collider_2025: Info').ngettext(msgid`${remaining} left`, `${remaining} left`, remaining),
    //         variant: 'low',
    //     };
    // }

    return null;
};

const SelectionOptionRow = ({
    label,
    description,
    isSelected,
    isDisabled = false,
    onSelect,
    statusBadge = null,
}: {
    label: string;
    description: string;
    isSelected: boolean;
    isDisabled?: boolean;
    onSelect: () => void;
    statusBadge?: { label: string; variant: ModelStatusBadgeVariant } | null;
}) => {
    return (
        <button
            type="button"
            className={clsx(
                'model-mode-option flex flex-row flex-nowrap items-center gap-3 w-full border-none text-left cursor-pointer py-2 px-2 rounded-lg',
                isSelected && 'is-selected',
                isDisabled && 'is-disabled cursor-not-allowed'
            )}
            disabled={isDisabled}
            onClick={isDisabled ? undefined : onSelect}
        >
            <div className="model-mode-option-radio shrink-0">
                {isSelected ? (
                    <LumoIcon name="CircleCheck" size={20} className="color-norm" />
                ) : (
                    <LumoIcon name="Circle" size={20} className={clsx(isDisabled ? 'color-hint' : 'color-weak')} />
                )}
            </div>
            <div className="flex flex-column flex-nowrap flex-1 gap-0.5 min-w-0">
                <div className="flex flex-row flex-nowrap items-center gap-2 min-w-0">
                    <span className={clsx('text-sm text-semibold', isDisabled && 'color-hint')}>{label}</span>
                    {statusBadge && (
                        <span
                            className={clsx(
                                'model-mode-status-pill shrink-0',
                                `model-mode-status-pill--${statusBadge.variant}`
                            )}
                        >
                            {statusBadge.label}
                        </span>
                    )}
                </div>
                <span className="text-xs color-weak">{description}</span>
            </div>
        </button>
    );
};

const ModelOptionRow = ({
    option,
    isSelected,
    isDisabled,
    onSelect,
}: {
    option: ModelModeOption;
    isSelected: boolean;
    isDisabled: boolean;
    onSelect: () => void;
}) => {
    const remaining = option.getRemaining?.();
    const unavailableReason = option.getUnavailableReason?.() ?? null;
    const statusBadge = getModelStatusBadge(remaining, unavailableReason);

    return (
        <SelectionOptionRow
            label={option.getLabel()}
            description={option.getDescription()}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelect={onSelect}
            statusBadge={statusBadge}
        />
    );
};

const ResponseModeOptionRow = ({
    option,
    isSelected,
    onSelect,
}: {
    option: ResponseModeOption;
    isSelected: boolean;
    onSelect: () => void;
}) => {
    return (
        <SelectionOptionRow
            label={option.getLabel()}
            description={option.getDescription()}
            isSelected={isSelected}
            onSelect={onSelect}
        />
    );
};

const ResponseModeRow = ({
    option,
    isActive,
    onSelect,
}: {
    option: ResponseModeOption;
    isActive: boolean;
    onSelect: () => void;
}) => (
    <button
        type="button"
        role="tab"
        aria-selected={isActive}
        className={clsx(
            'model-mode-tab flex flex-column flex-nowrap gap-0.5 p-3 border-none rounded-lg text-left cursor-pointer w-full',
            isActive && 'is-active'
        )}
        onClick={onSelect}
    >
        <span className="text-sm text-semibold">{option.getLabel()}</span>
        <span className="text-xs color-weak">{option.getDescription()}</span>
    </button>
);

export interface ModelModePanelProps {
    layout: ModelModePanelLayout;
    modelOptions: ModelModeOption[];
    responseModeOptions: ResponseModeOption[];
    selectedModelTier: ModelTier;
    responseMode: ResponseMode;
    showUpgradeFooter: boolean;
    upsellPath?: string;
    onUpgrade?: () => void;
    onSelectModel: (tier: ModelTier) => void;
    onSelectResponseMode: (mode: ResponseMode) => void;
    onClose?: () => void;
}

export const ModelModePanel = ({
    layout,
    modelOptions,
    responseModeOptions,
    selectedModelTier,
    responseMode,
    showUpgradeFooter,
    upsellPath,
    onUpgrade,
    onSelectModel,
    onSelectResponseMode,
    onClose,
}: ModelModePanelProps) => {
    const isSheet = layout === 'sheet';

    let handleUpgradeClick: (() => void) | undefined;
    if (onUpgrade) {
        handleUpgradeClick = () => {
            sendUpgradeButtonClickedEvent({
                feature: LUMO_UPSELL_PATHS.COMPOSER_MODEL_SELECTOR,
                to: 'modal',
            });
            onUpgrade();
            onClose?.();
        };
    } else if (upsellPath) {
        handleUpgradeClick = () => {
            sendUpgradeButtonClickedEvent({
                feature: LUMO_UPSELL_PATHS.COMPOSER_MODEL_SELECTOR,
                to: 'path',
            });
            onClose?.();
        };
    }

    return (
        <div
            className={clsx(
                'model-mode-picker flex flex-column flex-nowrap w-full',
                isSheet ? 'model-mode-picker--sheet' : 'model-mode-picker--dropdown'
            )}
        >
            <div
                className={clsx(
                    'model-mode-panel flex flex-column flex-nowrap w-full overflow-hidden',
                    isSheet ? 'model-mode-panel--sheet' : 'model-mode-panel--dropdown',
                    !isSheet && showUpgradeFooter && 'model-mode-panel--with-upgrade-footer'
                )}
            >
                <div className="model-mode-panel-body flex flex-column flex-nowrap w-full">
                    <div className="model-mode-section flex flex-column flex-nowrap gap-1 pb-3">
                        <span className="model-mode-section-title p-2">{c('collider_2025: Label').t`AI model`}</span>
                        {modelOptions.map((option) => {
                            const isDisabled = option.isDisabled?.() ?? false;

                            return (
                                <ModelOptionRow
                                    key={option.tier}
                                    option={option}
                                    isSelected={selectedModelTier === option.tier}
                                    isDisabled={isDisabled}
                                    onSelect={() => onSelectModel(option.tier)}
                                />
                            );
                        })}
                    </div>
                    <hr />

                    <div className={clsx('model-mode-section flex flex-column flex-nowrap', isSheet && 'gap-1')}>
                        <span className="model-mode-section-title p-2">{c('collider_2025: Label').t`Answer mode`}</span>
                        {isSheet ? (
                            responseModeOptions.map((option) => {
                                return (
                                    <ResponseModeOptionRow
                                        key={option.mode}
                                        option={option}
                                        isSelected={responseMode === option.mode}
                                        onSelect={() => onSelectResponseMode(option.mode)}
                                    />
                                );
                            })
                        ) : (
                            <div
                                className="model-mode-response-grid grid grid-cols-2 gap-2 w-full"
                                role="tablist"
                                aria-label={c('collider_2025: Label').t`Answer mode`}
                            >
                                {responseModeOptions.map((option) => {
                                    return (
                                        <ResponseModeRow
                                            key={option.mode}
                                            option={option}
                                            isActive={responseMode === option.mode}
                                            onSelect={() => onSelectResponseMode(option.mode)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showUpgradeFooter && (
                <div className="model-mode-upgrade flex items-center gap-2 min-w-0 flex-nowrap">
                    <p className="model-mode-upgrade-text min-w-0 m-0 color-norm">
                        {c('collider_2025: Info')
                            .t`Upgrade for unlimited chats, projects, larger file uploads, and more.`}
                    </p>
                    <BasicUpgradeButton
                        className="model-mode-upgrade-button text-sm"
                        size="small"
                        path={upsellPath}
                        onClick={handleUpgradeClick}
                    />
                </div>
            )}
        </div>
    );
};

export const buildModelModeOptions = (
    remainingLimits: { lite?: number; max?: number } | null,
    isMaxAvailableByFlag: boolean,
    isApertusEnabled: boolean
): ModelModeOption[] => [
    ...(isApertusEnabled
        ? [
              {
                  tier: 'apertus-15' as const,
                  getLabel: () => 'Apertus 1.5 🇨🇭',
                  getDescription: () => c('collider_2025: Description').t`Fully open, Swiss model for lighter tasks`,
                  getRemaining: () => remainingLimits?.lite,
                  isDisabled: () => isLimitExhausted(remainingLimits?.lite),
              },
          ]
        : []),
    {
        tier: 'lumo-lite',
        getLabel: () => `${LUMO_SHORT_APP_NAME} 2.0 Lite`,
        getDescription: () => c('collider_2025: Description').t`Lightweight model for everyday tasks`,
        getRemaining: () => remainingLimits?.lite,
        isDisabled: () => isLimitExhausted(remainingLimits?.lite),
    },
    {
        tier: 'lumo-max',
        getLabel: () => `${LUMO_SHORT_APP_NAME} 2.0 Max`,
        getDescription: () =>
            isMaxAvailableByFlag
                ? c('collider_2025: Description').t`High-performance model for complex tasks`
                : c('collider_2025: Description').t`Temporarily unavailable due to high load`,
        getRemaining: () => remainingLimits?.max,
        getUnavailableReason: () => (!isMaxAvailableByFlag ? 'high-load' : null),
        isDisabled: () => !isModelTierSelectable('lumo-max', remainingLimits, { isMaxAvailable: isMaxAvailableByFlag }),
    },
];

import { useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useMaxModelAvailability } from '../../hooks/useMaxModelAvailability';
import { getSelectedModelTier, useModelTier } from '../../providers/ModelTierProvider';
import { useLumoDispatch } from '../../redux/hooks';
import { clearTierErrors } from '../../redux/slices/meta/errors';
import { areAllModelLimitsExhausted, isModelTierSelectable, useRemainingLimits } from '../../services/usageLimitsStore';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import { LumoIcon } from '../LumoIcon/LumoIcon';
import { ModelModeBottomSheet } from './ModelModeBottomSheet';
import { ModelModePanel, buildModelModeOptions, getResponseModeOptions } from './ModelModePanel';
import { MenuDropdown } from './components/MenuDropdown';
import { useNativeComposerModelTierApi } from './hooks/useNativeComposerModelTierApi';

import './ModelModeDropdown.scss';

export const ModelModeDropdown = () => {
    const { modelTier, setModelTier, responseMode, setResponseMode } = useModelTier();
    const { hasLumoPlus } = useLumoPlan();
    const { isMaxAvailableByFlag } = useMaxModelAvailability();
    const { apertusModelAvailable } = useLumoFlags();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const dispatch = useLumoDispatch();
    const remainingLimits = useRemainingLimits();
    const upsellConfig = useLumoPlusUpsellButtonConfig(LUMO_UPSELL_PATHS.COMPOSER_MODEL_SELECTOR);
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const modelOptions = useMemo(
        () => buildModelModeOptions(remainingLimits, isMaxAvailableByFlag, apertusModelAvailable),
        [remainingLimits, isMaxAvailableByFlag, apertusModelAvailable]
    );
    const responseModeOptions = getResponseModeOptions();
    const selectedModelTier = getSelectedModelTier(modelTier);
    const currentModelOption = modelOptions.find((option) => option.tier === selectedModelTier) ?? modelOptions[0];

    useNativeComposerModelTierApi(modelTier, setModelTier, responseMode, setResponseMode);

    const allModelLimitsExhausted = areAllModelLimitsExhausted(remainingLimits);
    const showUpgradeFooter =
        !hasLumoPlus && !allModelLimitsExhausted && Boolean(upsellConfig?.onUpgrade || upsellConfig?.path);

    const handleSelectModel = (tier: typeof selectedModelTier) => {
        setModelTier(tier);
        if (
            isModelTierSelectable(tier, remainingLimits, {
                isMaxAvailable: isMaxAvailableByFlag,
                isApertusEnabled: apertusModelAvailable,
            })
        ) {
            dispatch(clearTierErrors());
        }
        setIsOpen(false);
    };

    const panelProps = {
        modelOptions,
        responseModeOptions,
        selectedModelTier,
        responseMode,
        showUpgradeFooter,
        upsellPath: upsellConfig?.path,
        onUpgrade: upsellConfig?.onUpgrade,
        onSelectModel: handleSelectModel,
        onSelectResponseMode: setResponseMode,
        onClose: () => setIsOpen(false),
    };

    return (
        <>
            <Button
                ref={triggerRef}
                shape="ghost"
                size="small"
                className={clsx(
                    'model-mode-trigger border-0 shrink-0 flex flex-row flex-nowrap gap-1 items-center color-norm py-1 px-2 rounded-full text-sm',
                    isOpen && 'bg-weak'
                )}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className={clsx('font-medium', !isSmallScreen && 'hidden sm:block')}>
                    {currentModelOption.getLabel()}
                </span>
                <LumoIcon name="ChevronDown" width={12} height={12} />
            </Button>

            {isSmallScreen ? (
                <ModelModeBottomSheet open={isOpen} onClose={() => setIsOpen(false)}>
                    <ModelModePanel layout="sheet" {...panelProps} />
                </ModelModeBottomSheet>
            ) : (
                <MenuDropdown
                    isOpen={isOpen}
                    anchorRef={triggerRef}
                    onClose={() => setIsOpen(false)}
                    placement="top-end"
                    className="model-mode-dropdown"
                    autoClose={false}
                    size={{
                        width: '26rem',
                        height: DropdownSizeUnit.Dynamic,
                    }}
                >
                    <ModelModePanel layout="dropdown" {...panelProps} />
                </MenuDropdown>
            )}
        </>
    );
};

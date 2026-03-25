import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import type { IconName } from '@proton/icons/types';
import lumoPlusLogo from '@proton/styles/assets/img/lumo/lumo-plus-logo.svg';

import { type ModelTier, useModelTier } from '../../providers/ModelTierProvider';
import { MenuDropdown, MenuItem } from './components/MenuDropdown';
import { useNativeComposerModelTierApi } from './hooks/useNativeComposerModelTierApi';

import './ModelModeDropdown.scss';

interface ModeOption {
    mode: ModelTier;
    iconName: IconName;
    getLabel: () => string;
    getDescription: () => string;
    badge?: React.ReactNode;
}

const LumoPlusBadge = () => <img src={lumoPlusLogo} alt="Lumo+ Logo" className="lumo-plus-badge" />;

const getModeOptions = (): ModeOption[] => [
    {
        mode: 'auto',
        iconName: 'pen-sparks' as IconName,
        getLabel: () => c('collider_2025: Label').t`Auto`,
        getDescription: () => c('collider_2025: Description').t`Auto choose the best model`,
    },
    {
        mode: 'fast',
        iconName: 'bolt' as IconName,
        getLabel: () => c('collider_2025: Label').t`Fast`,
        getDescription: () => c('collider_2025: Description').t`Quick responses`,
    },
    {
        mode: 'thinking',
        iconName: 'lightbulb' as IconName,
        getLabel: () => c('collider_2025: Label').t`Thinking`,
        getDescription: () => c('collider_2025: Description').t`Solves complex problems`,
        badge: <LumoPlusBadge />,
    },
];

export const ModelModeDropdown = () => {
    const { modelTier, setModelTier } = useModelTier();
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

    const modeOptions = getModeOptions();
    const currentOption = modeOptions.find((o) => o.mode === modelTier) ?? modeOptions[0];

    useNativeComposerModelTierApi(modelTier, setModelTier);

    return (
        <>
            <Button
                ref={anchorRef}
                shape="ghost"
                size="small"
                className={clsx(
                    'model-mode-trigger border-0 shrink-0 flex flex-row flex-nowrap gap-1.5 items-center color-norm py-1 px-2 rounded-full text-sm',
                    isOpen && 'is-active'
                )}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <Icon name={currentOption.iconName} size={4} className="color-weak shrink-0" />
                <span className="hidden sm:block font-medium">{currentOption.getLabel()}</span>
                <IcChevronDown size={3} className="color-weak" />
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => setIsOpen(false)}
                placement="top-end"
                width="14rem"
                className="model-mode-dropdown"
            >
                {modeOptions.map((option) => (
                    <MenuItem
                        key={option.mode}
                        iconName={option.iconName}
                        getLabel={option.getLabel}
                        getDescription={option.getDescription}
                        badge={option.badge}
                        onClick={() => setModelTier(option.mode)}
                        onClose={() => setIsOpen(false)}
                        rightElement={
                            <span
                                className={clsx(
                                    'model-mode-checkmark shrink-0',
                                    modelTier !== option.mode && 'visibility-hidden'
                                )}
                            >
                                <IcCheckmark size={4} className="color-primary" />
                            </span>
                        }
                    />
                ))}
            </MenuDropdown>
        </>
    );
};

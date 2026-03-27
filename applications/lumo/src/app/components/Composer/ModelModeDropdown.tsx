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
    iconName?: IconName;
    getLabel: () => string;
    getDescription: () => string;
    badge?: React.ReactNode;
    iconSvg?: React.ComponentType;
}

const LumoPlusBadge = () => <img src={lumoPlusLogo} alt="Lumo+ Logo" className="lumo-plus-badge" />;

const DiamondIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
            d="M10.5 3.90039C10.8313 3.90039 11.0996 4.16863 11.0996 4.5C11.0996 4.83137 10.8313 5.09961 10.5 5.09961H3.71094L2.71094 5.90039H15C15.2353 5.90039 15.4486 6.0377 15.5459 6.25195C15.6432 6.46635 15.6062 6.71833 15.4512 6.89551L8.45117 14.8955C8.33724 15.0255 8.17282 15.0996 8 15.0996C7.82717 15.0996 7.66276 15.0255 7.54883 14.8955L0.548828 6.89551C0.441096 6.77239 0.387967 6.61022 0.402344 6.44727C0.416832 6.28419 0.497156 6.13352 0.625 6.03125L3.125 4.03125C3.23139 3.94614 3.36377 3.90039 3.5 3.90039H10.5ZM8 12.79L10.1338 7.09961H5.86621L8 12.79ZM6.28027 11.623L4.58398 7.09961H2.32129L6.28027 11.623ZM9.71875 11.623L13.6787 7.09961H11.416L9.71875 11.623ZM13.582 1.44336H13.583L13.584 1.44531C13.585 1.44677 13.586 1.44938 13.5879 1.45215C13.5916 1.45766 13.5976 1.46534 13.6045 1.47559C13.6184 1.49625 13.6384 1.52603 13.6621 1.5625C13.7096 1.63559 13.7733 1.73707 13.8369 1.84668C13.9002 1.95573 13.9648 2.07528 14.0137 2.18652C14.0609 2.29391 14.0996 2.40825 14.0996 2.5V2.89941H14.5C14.5916 2.89941 14.7052 2.93922 14.8125 2.98633C14.9238 3.03526 15.0441 3.09976 15.1533 3.16309C15.2629 3.22669 15.3644 3.29041 15.4375 3.33789C15.474 3.36158 15.5037 3.38161 15.5244 3.39551C15.5347 3.4024 15.5423 3.40835 15.5479 3.41211C15.5506 3.414 15.5532 3.41501 15.5547 3.41602L15.5566 3.41699V3.41797L15.6758 3.5L15.5566 3.58203L15.5547 3.58398C15.5532 3.58499 15.5506 3.586 15.5479 3.58789C15.5423 3.59165 15.5347 3.5976 15.5244 3.60449C15.5037 3.61838 15.474 3.63843 15.4375 3.66211C15.3644 3.70957 15.2629 3.77334 15.1533 3.83691C15.0442 3.90021 14.9238 3.96477 14.8125 4.01367C14.732 4.04899 14.6479 4.07953 14.5723 4.09277L14.5 4.09961H14.0996V4.5L14.0928 4.57227C14.0795 4.64791 14.049 4.73204 14.0137 4.8125C13.9648 4.92383 13.9002 5.04416 13.8369 5.15332C13.7733 5.26295 13.7096 5.3644 13.6621 5.4375C13.6384 5.47398 13.6184 5.50374 13.6045 5.52441C13.5976 5.53466 13.5916 5.54234 13.5879 5.54785C13.586 5.55062 13.585 5.55323 13.584 5.55469L13.583 5.55664H13.582L13.5 5.67578L13.418 5.55664H13.417L13.416 5.55469C13.415 5.55323 13.414 5.55062 13.4121 5.54785C13.4083 5.54234 13.4024 5.53466 13.3955 5.52441C13.3816 5.50374 13.3616 5.47398 13.3379 5.4375C13.2904 5.3644 13.2267 5.26295 13.1631 5.15332C13.0998 5.04415 13.0353 4.92385 12.9863 4.8125C12.9392 4.70524 12.8994 4.59162 12.8994 4.5L12.9004 4.09961H12.5C12.4083 4.09961 12.2939 4.06084 12.1865 4.01367C12.0751 3.96473 11.9559 3.89925 11.8467 3.83594C11.7371 3.77237 11.6356 3.70956 11.5625 3.66211C11.526 3.63843 11.4963 3.61838 11.4756 3.60449C11.4653 3.5976 11.4577 3.59165 11.4521 3.58789C11.4494 3.586 11.4468 3.58499 11.4453 3.58398L11.4434 3.58301V3.58203L11.3242 3.5L11.4434 3.41797V3.41699L11.4453 3.41602C11.4468 3.41501 11.4494 3.414 11.4521 3.41211C11.4577 3.40835 11.4653 3.4024 11.4756 3.39551C11.4963 3.38161 11.526 3.36159 11.5625 3.33789C11.6356 3.2904 11.7371 3.2267 11.8467 3.16309C11.9557 3.09981 12.0753 3.03524 12.1865 2.98633C12.2939 2.93913 12.4083 2.89941 12.5 2.89941H12.9004V2.5C12.9004 2.40825 12.9391 2.29391 12.9863 2.18652C13.0352 2.07528 13.0998 1.95573 13.1631 1.84668C13.2267 1.73707 13.2904 1.63559 13.3379 1.5625C13.3616 1.52603 13.3816 1.49625 13.3955 1.47559C13.4024 1.46534 13.4084 1.45766 13.4121 1.45215C13.414 1.44938 13.415 1.44677 13.416 1.44531L13.417 1.44336H13.418L13.5 1.32422L13.582 1.44336Z"
            fill="#5C5958"
            stroke="#5C5958"
            strokeWidth="0.2"
        />
    </svg>
);

const getModeOptions = (): ModeOption[] => [
    {
        mode: 'auto',
        getLabel: () => c('collider_2025: Label').t`Auto`,
        getDescription: () => c('collider_2025: Description').t`Auto choose the best model`,
        iconSvg: DiamondIcon,
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
                {currentOption.iconSvg ? (
                    <currentOption.iconSvg />
                ) : (
                    currentOption.iconName && (
                        <Icon name={currentOption.iconName} size={4} className="color-weak shrink-0" />
                    )
                )}
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
                        iconSvg={option.iconSvg}
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

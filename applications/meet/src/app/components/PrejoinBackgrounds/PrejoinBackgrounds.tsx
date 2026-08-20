import type { CSSProperties, ReactNode } from 'react';

import { c } from 'ttag';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { BackgroundEffect } from '../../utils/virtualBackgrounds/virtualBackgrounds';
import { BackgroundTile } from '../Backgrounds/BackgroundTile';
import { getBackgroundEffectOptions, getVirtualBackgroundOptions } from '../Backgrounds/backgroundOptions';

import './PrejoinBackgrounds.scss';

interface BackgroundOption {
    effect: BackgroundEffect;
    label: string;
    icon?: ReactNode;
    style?: CSSProperties;
}

interface PrejoinBackgroundsProps {
    onClose: () => void;
}

export const PrejoinBackgrounds = ({ onClose }: PrejoinBackgroundsProps) => {
    const { isBackgroundBlurSupported, appliedBackgroundEffect, pendingBackgroundEffect, selectBackgroundEffect } =
        useMediaManagementContext();

    const selectedEffect = pendingBackgroundEffect ?? appliedBackgroundEffect;

    const options: BackgroundOption[] = [
        ...getBackgroundEffectOptions().map(({ effect, label, Icon }) => ({
            effect,
            label,
            icon: <Icon size={5} />,
        })),
        ...getVirtualBackgroundOptions().map(({ effect, label, color }) => ({
            effect,
            label,
            style: { backgroundColor: color },
        })),
    ];

    return (
        <div className="prejoin-backgrounds flex flex-column flex-nowrap items-start gap-2 self-stretch p-2 mt-2 border meet-radius">
            <div className="flex flex-nowrap items-center justify-space-between gap-2 w-full">
                <h3 className="m-0 ml-2 text-rg meet-font-weight">{c('Title').t`Backgrounds`}</h3>
                <CloseButton onClose={onClose} />
            </div>

            {isBackgroundBlurSupported ? (
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                <div className="flex flex-nowrap gap-2 w-full" role="listbox" aria-label={c('Aria').t`Backgrounds`}>
                    {options.map(({ effect, label, icon, style }) => (
                        <BackgroundTile
                            key={effect}
                            label={label}
                            isSelected={selectedEffect === effect}
                            isPending={pendingBackgroundEffect === effect}
                            onClick={() => {
                                void selectBackgroundEffect(effect);
                            }}
                            className="prejoin-backgrounds-option"
                            style={style}
                        >
                            {icon}
                        </BackgroundTile>
                    ))}
                </div>
            ) : (
                <p className="m-0 px-2 w-full text-sm color-weak">{c('Info')
                    .t`Background effects are not supported on your browser`}</p>
            )}
        </div>
    );
};

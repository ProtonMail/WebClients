import { c } from 'ttag';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { BackgroundOption } from '../Backgrounds/BackgroundOptionGroup';
import { BackgroundOptionGroup } from '../Backgrounds/BackgroundOptionGroup';
import { getBackgroundEffectOptions, getVirtualBackgroundOptions } from '../Backgrounds/backgroundOptions';

import './PrejoinBackgrounds.scss';

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
        ...getVirtualBackgroundOptions().map(({ effect, label, thumbnailUrl }) => ({
            effect,
            label,
            thumbnailUrl,
        })),
    ];

    return (
        <div className="prejoin-backgrounds flex flex-column flex-nowrap items-start gap-2 self-stretch p-2 mt-2 border meet-radius">
            <div className="flex flex-nowrap items-center justify-space-between gap-2 w-full">
                <h3 className="m-0 ml-2 text-rg meet-font-weight">{c('Title').t`Backgrounds`}</h3>
                <CloseButton onClose={onClose} />
            </div>

            {isBackgroundBlurSupported ? (
                <BackgroundOptionGroup
                    label={c('Aria').t`Backgrounds`}
                    options={options}
                    selectedEffect={selectedEffect}
                    pendingEffect={pendingBackgroundEffect}
                    onSelect={(effect) => {
                        void selectBackgroundEffect(effect);
                    }}
                    className="prejoin-backgrounds-options flex flex-nowrap gap-2 w-full"
                    tileClassName="prejoin-backgrounds-option"
                />
            ) : (
                <p className="m-0 px-2 w-full text-sm color-weak">{c('Info')
                    .t`Background effects are not supported on your browser`}</p>
            )}
        </div>
    );
};

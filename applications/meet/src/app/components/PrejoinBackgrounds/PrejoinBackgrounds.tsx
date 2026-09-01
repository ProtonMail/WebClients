import { useEffect } from 'react';

import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectPendingBackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useBackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { useAppliedBackgroundEffect } from '../../contexts/BackgroundEffects/useAppliedBackgroundEffect';
import { supportsBackgroundEffects } from '../../processors/background-processor/createBackgroundProcessor';
import { BackgroundOptionGroup } from '../Backgrounds/BackgroundOptionGroup';
import {
    getBackgroundEffectOptions,
    getUnsupportedBackgroundEffectsNotice,
    getVirtualBackgroundOptions,
} from '../Backgrounds/backgroundOptions';
import { useCustomBackgroundTiles } from '../Backgrounds/useCustomBackgroundTiles';

import './PrejoinBackgrounds.scss';

interface PrejoinBackgroundsProps {
    onClose: () => void;
}

export const PrejoinBackgrounds = ({ onClose }: PrejoinBackgroundsProps) => {
    const appliedBackgroundEffect = useAppliedBackgroundEffect();
    const pendingBackgroundEffect = useMeetSelector(selectPendingBackgroundEffect);

    const isBackgroundBlurSupported = supportsBackgroundEffects();
    const { selectBackgroundEffect } = useBackgroundEffectsContext();
    const {
        options: customBackgroundOptions,
        renderActionTile,
        ensureLoaded,
    } = useCustomBackgroundTiles({ className: 'prejoin-backgrounds-option' });

    // Mounted only while the picker is open, so this is the moment Drive is worth asking.
    useEffect(() => {
        ensureLoaded();
    }, [ensureLoaded]);

    const selectedEffect = pendingBackgroundEffect ?? appliedBackgroundEffect;

    const effectOptions = getBackgroundEffectOptions();

    const options = [...effectOptions, ...customBackgroundOptions, ...getVirtualBackgroundOptions()];

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
                    renderActionTile={renderActionTile}
                    actionTileIndex={effectOptions.length}
                />
            ) : (
                <p className="m-0 px-2 w-full text-sm color-weak">{getUnsupportedBackgroundEffectsNotice()}</p>
            )}
        </div>
    );
};

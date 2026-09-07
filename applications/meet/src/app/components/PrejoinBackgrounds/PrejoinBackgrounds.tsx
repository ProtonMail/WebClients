import { c } from 'ttag';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useIsBackgroundEffectsSupported } from '../../contexts/BackgroundEffects/useIsBackgroundEffectsSupported';
import { BackgroundOptionGroup } from '../Backgrounds/BackgroundOptionGroup';
import { getUnsupportedBackgroundEffectsNotice } from '../Backgrounds/backgroundOptions';
import { usePrejoinBackgroundOptions } from './usePrejoinBackgroundOptions';

import './PrejoinBackgrounds.scss';

interface PrejoinBackgroundsProps {
    onClose: () => void;
}

export const PrejoinBackgrounds = ({ onClose }: PrejoinBackgroundsProps) => {
    const isBackgroundBlurSupported = useIsBackgroundEffectsSupported();

    const { options, actionTileIndex, renderActionTile, selectedEffect, pendingEffect, onSelect } =
        usePrejoinBackgroundOptions({ tileClassName: 'prejoin-backgrounds-option' });

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
                    pendingEffect={pendingEffect}
                    onSelect={onSelect}
                    className="prejoin-backgrounds-options flex flex-nowrap gap-2"
                    tileClassName="prejoin-backgrounds-option"
                    renderActionTile={renderActionTile}
                    actionTileIndex={actionTileIndex}
                />
            ) : (
                <p className="m-0 px-2 w-full text-sm color-weak">{getUnsupportedBackgroundEffectsNotice()}</p>
            )}
        </div>
    );
};

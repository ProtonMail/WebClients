import { c } from 'ttag';

import { useIsBackgroundEffectsSupported } from '../../contexts/BackgroundEffects/useIsBackgroundEffectsSupported';
import { BackgroundOptionGroup } from '../Backgrounds/BackgroundOptionGroup';
import { getUnsupportedBackgroundEffectsNotice } from '../Backgrounds/backgroundOptions';
import { SlideClosable } from '../SlideClosable/SlideClosable';
import { usePrejoinBackgroundOptions } from './usePrejoinBackgroundOptions';

import './PrejoinBackgrounds.scss';

interface PrejoinBackgroundsSheetProps {
    onClose: () => void;
}

export const PrejoinBackgroundsSheet = ({ onClose }: PrejoinBackgroundsSheetProps) => {
    const isBackgroundBlurSupported = useIsBackgroundEffectsSupported();

    const { options, actionTileIndex, renderActionTile, selectedEffect, pendingEffect, onSelect } =
        usePrejoinBackgroundOptions();

    return (
        <SlideClosable variant="sheet" onClose={onClose}>
            <div className="prejoin-backgrounds-sheet flex flex-column flex-nowrap gap-4 w-full px-4 pt-8 overflow-y-auto">
                <h2 className="m-0 text-3xl text-semibold">{c('Title').t`Backgrounds`}</h2>

                {isBackgroundBlurSupported ? (
                    <BackgroundOptionGroup
                        label={c('Aria').t`Backgrounds`}
                        options={options}
                        selectedEffect={selectedEffect}
                        pendingEffect={pendingEffect}
                        onSelect={onSelect}
                        className="grid grid-cols-3 gap-2 w-full"
                        renderActionTile={renderActionTile}
                        actionTileIndex={actionTileIndex}
                    />
                ) : (
                    <p className="m-0 text-sm color-weak">{getUnsupportedBackgroundEffectsNotice()}</p>
                )}
            </div>
        </SlideClosable>
    );
};

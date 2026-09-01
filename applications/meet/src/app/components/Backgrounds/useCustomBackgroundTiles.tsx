import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectCanAddCustomBackground,
    selectCustomBackgrounds,
    selectHasReachedCustomBackgroundLimit,
    selectIsAddingCustomBackground,
    selectIsCustomBackgroundDriveUnavailable,
} from '@proton/meet/store/slices/customBackgroundsSlice';
import noop from '@proton/utils/noop';

import { useCustomBackgroundsContext } from '../../contexts/CustomBackgroundsContext';
import { useIsCustomBackgroundsEnabled } from '../../hooks/useIsCustomBackgroundsEnabled';
import { AddBackgroundTile } from './AddBackgroundTile';
import type { BackgroundActionTileProps } from './BackgroundOptionGroup';
import { getAddBackgroundNotice, getCustomBackgroundOptions } from './backgroundOptions';

interface Options {
    disabledReason?: string;
    className?: string;
}

export const useCustomBackgroundTiles = ({ disabledReason, className }: Options = {}) => {
    const isEnabled = useIsCustomBackgroundsEnabled();

    const backgrounds = useMeetSelector(selectCustomBackgrounds);
    const canAddBackground = useMeetSelector(selectCanAddCustomBackground);
    const hasReachedBackgroundLimit = useMeetSelector(selectHasReachedCustomBackgroundLimit);
    const isDriveUnavailable = useMeetSelector(selectIsCustomBackgroundDriveUnavailable);
    const isAddingBackground = useMeetSelector(selectIsAddingCustomBackground);

    const { addBackground, deleteBackground, ensureLoaded } = useCustomBackgroundsContext();

    if (!isEnabled) {
        return { options: [], renderActionTile: undefined, ensureLoaded };
    }

    return {
        options: getCustomBackgroundOptions(backgrounds, deleteBackground),
        renderActionTile: (actionTileProps: BackgroundActionTileProps) => (
            <AddBackgroundTile
                {...actionTileProps}
                onAdd={(file) => {
                    addBackground(file).catch(noop);
                }}
                disabled={!!disabledReason || !canAddBackground}
                disabledReason={
                    disabledReason ??
                    getAddBackgroundNotice({ hasReachedLimit: hasReachedBackgroundLimit, isDriveUnavailable })
                }
                isAdding={isAddingBackground}
                className={className}
            />
        ),
        ensureLoaded,
    };
};

import { useEffect, useId } from 'react';

import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { selectPendingBackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { selectActiveCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SideBarSection } from '../../atoms/SideBarSection/SideBarSection';
import { useBackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { useAppliedBackgroundEffect } from '../../contexts/BackgroundEffects/useAppliedBackgroundEffect';
import { useIsBackgroundEffectsSupported } from '../../contexts/BackgroundEffects/useIsBackgroundEffectsSupported';
import { BackgroundOptionGroup } from './BackgroundOptionGroup';
import { BackgroundPreview } from './BackgroundPreview';
import {
    getBackgroundEffectOptions,
    getUnsupportedBackgroundEffectsNotice,
    getVirtualBackgroundOptions,
} from './backgroundOptions';
import { useCustomBackgroundTiles } from './useCustomBackgroundTiles';

export const Backgrounds = () => {
    const dispatch = useMeetDispatch();

    const unsupportedNoticeId = useId();

    const sideBarState = useMeetSelector(selectSideBarState);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);
    const appliedBackgroundEffect = useAppliedBackgroundEffect();
    const pendingBackgroundEffect = useMeetSelector(selectPendingBackgroundEffect);

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const isBackgroundBlurSupported = useIsBackgroundEffectsSupported();
    const unsupportedNotice = getUnsupportedBackgroundEffectsNotice();
    const { selectBackgroundEffect } = useBackgroundEffectsContext();
    const {
        options: customBackgroundOptions,
        renderActionTile,
        ensureLoaded,
    } = useCustomBackgroundTiles({ disabledReason: isBackgroundBlurSupported ? undefined : unsupportedNotice });

    const isOpen = sideBarState[MeetingSideBars.Backgrounds];

    // Opening the picker is what asks Drive for the backgrounds, so joining a meeting does not.
    useEffect(() => {
        if (isOpen && isVirtualBackgroundEnabled) {
            ensureLoaded();
        }
    }, [isOpen, isVirtualBackgroundEnabled, ensureLoaded]);

    if (!isVirtualBackgroundEnabled || !isOpen) {
        return null;
    }

    const selectedEffect = pendingBackgroundEffect ?? appliedBackgroundEffect;

    const handleSelectEffect = (effect: BackgroundEffect) => {
        void selectBackgroundEffect(effect);
    };

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.Backgrounds))}
            aria-label={c('Aria').t`Backgrounds`}
            absoluteHeader={true}
            paddingClassName="px-4 py-4"
            header={
                <div className="flex items-center">
                    <h2 className="text-3xl text-semibold">{c('Title').t`Backgrounds`}</h2>
                </div>
            }
        >
            {/* The header floats over the scroll region so the options blur behind it, leaving the
                measured header height to keep the first section clear of it. */}
            <div
                className="overflow-y-auto flex-1 min-h-0 pt-custom"
                style={{ '--pt-custom': 'var(--side-bar-header-height)' }}
            >
                <div className="flex flex-column flex-nowrap w-full gap-2">
                    <BackgroundPreview selectedCameraId={activeCameraDeviceId} />

                    <SideBarSection title={c('Title').t`Blur and personal`}>
                        <BackgroundOptionGroup
                            label={c('Aria').t`Blur and personal`}
                            options={[...getBackgroundEffectOptions(), ...customBackgroundOptions]}
                            selectedEffect={selectedEffect}
                            pendingEffect={pendingBackgroundEffect}
                            onSelect={handleSelectEffect}
                            disabled={!isBackgroundBlurSupported}
                            describedById={isBackgroundBlurSupported ? undefined : unsupportedNoticeId}
                            className="grid grid-cols-3 gap-2 w-full"
                            renderActionTile={renderActionTile}
                            actionTileIndex={2}
                        />

                        {!isBackgroundBlurSupported && (
                            <p id={unsupportedNoticeId} className="m-0 text-sm color-weak">
                                {unsupportedNotice}
                            </p>
                        )}
                    </SideBarSection>

                    <SideBarSection title={c('Title').t`Virtual backgrounds`}>
                        <BackgroundOptionGroup
                            label={c('Aria').t`Virtual backgrounds`}
                            options={getVirtualBackgroundOptions()}
                            selectedEffect={selectedEffect}
                            pendingEffect={pendingBackgroundEffect}
                            onSelect={handleSelectEffect}
                            disabled={!isBackgroundBlurSupported}
                            describedById={isBackgroundBlurSupported ? undefined : unsupportedNoticeId}
                            className="grid grid-cols-3 gap-2 w-full"
                        />
                    </SideBarSection>
                </div>
            </div>
        </SideBar>
    );
};

import { c } from 'ttag';

import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcMeetBlur } from '@proton/icons/icons/IcMeetBlur';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectActiveCameraId } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectSelfView } from '@proton/meet/store/slices/settings';
import { MeetingSideBars, selectSideBarState, toggleSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { SideBar } from '../../atoms/SideBar/SideBar';
import { SideBarSection } from '../../atoms/SideBarSection/SideBarSection';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { BackgroundEffect } from '../../utils/virtualBackgrounds/virtualBackgrounds';
import { VIRTUAL_BACKGROUNDS, getVirtualBackgroundLabel } from '../../utils/virtualBackgrounds/virtualBackgrounds';
import { BackgroundPreview } from './BackgroundPreview';
import { BackgroundTile } from './BackgroundTile';

export const Backgrounds = () => {
    const dispatch = useMeetDispatch();

    const sideBarState = useMeetSelector(selectSideBarState);
    const isScreenShare = useMeetSelector(selectIsScreenShare);
    const isSelfViewEnabled = useMeetSelector(selectSelfView);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const {
        isVideoEnabled,
        isBackgroundBlurSupported,
        appliedBackgroundEffect,
        pendingBackgroundEffect,
        selectBackgroundEffect,
    } = useMediaManagementContext();

    if (!isVirtualBackgroundEnabled || !sideBarState[MeetingSideBars.Backgrounds]) {
        return null;
    }

    const selectedEffect = pendingBackgroundEffect ?? appliedBackgroundEffect;

    const isSelfViewVisibleInMeeting = isVideoEnabled && isSelfViewEnabled && !isScreenShare;
    const shouldShowPreview = isBackgroundBlurSupported && !isSelfViewVisibleInMeeting;

    const handleSelectEffect = (effect: BackgroundEffect) => {
        void selectBackgroundEffect(effect);
    };

    return (
        <SideBar
            onClose={() => dispatch(toggleSideBarState(MeetingSideBars.Backgrounds))}
            aria-label={c('Aria').t`Backgrounds`}
            header={
                <div className="flex items-center">
                    <h2 className="text-3xl text-semibold">{c('Title').t`Backgrounds`}</h2>
                </div>
            }
        >
            <div className="overflow-y-auto flex-1 min-h-0">
                <div className="flex flex-column flex-nowrap w-full gap-4">
                    {shouldShowPreview && <BackgroundPreview selectedCameraId={activeCameraDeviceId} />}

                    <SideBarSection title={c('Title').t`Background effects`}>
                        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                        <div
                            className="grid grid-cols-2 gap-3 w-full"
                            role="listbox"
                            aria-label={c('Aria').t`Background effects`}
                        >
                            <BackgroundTile
                                label={c('Action').t`No effect`}
                                isSelected={selectedEffect === 'none'}
                                isPending={pendingBackgroundEffect === 'none'}
                                disabled={!isBackgroundBlurSupported}
                                onClick={() => handleSelectEffect('none')}
                            >
                                <IcCircleSlash size={6} />
                            </BackgroundTile>

                            <BackgroundTile
                                label={c('Action').t`Blur background`}
                                isSelected={selectedEffect === 'blur'}
                                isPending={pendingBackgroundEffect === 'blur'}
                                disabled={!isBackgroundBlurSupported}
                                onClick={() => handleSelectEffect('blur')}
                            >
                                <IcMeetBlur size={6} />
                            </BackgroundTile>
                        </div>

                        {!isBackgroundBlurSupported && (
                            <p className="m-0 text-sm color-weak">{c('Info')
                                .t`Background effects are not supported on your browser`}</p>
                        )}
                    </SideBarSection>

                    <SideBarSection title={c('Title').t`Virtual backgrounds`}>
                        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
                        <div
                            className="grid grid-cols-2 gap-3 w-full"
                            role="listbox"
                            aria-label={c('Aria').t`Virtual backgrounds`}
                        >
                            {VIRTUAL_BACKGROUNDS.map(({ id, color }) => (
                                <BackgroundTile
                                    key={id}
                                    label={getVirtualBackgroundLabel(id)}
                                    isSelected={selectedEffect === id}
                                    isPending={pendingBackgroundEffect === id}
                                    disabled={!isBackgroundBlurSupported}
                                    onClick={() => handleSelectEffect(id)}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </SideBarSection>
                </div>
            </div>
        </SideBar>
    );
};

import { c } from 'ttag';

import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { MeetingName } from '../MeetingName/MeetingName';

export const MeetingNarrowDeviceHeader = () => {
    const isNarrowHeight = useIsNarrowHeight();
    const { handleRotateCamera, isVideoEnabled } = useMediaManagementContext();

    if (isNarrowHeight) {
        return null;
    }

    return (
        <div className="flex lg:hidden flex-nowrap gap-2 justify-between items-center">
            <MeetingName classNames={{ root: 'mb-3', name: 'flex-1 text-lg text-semibold' }} />
            <div className="text-ellipsis overflow-hidden">
                {isVideoEnabled && isMobile() && (
                    <CircleButton
                        IconComponent={IcMeetRotateCamera}
                        onClick={() => handleRotateCamera()}
                        ariaLabel={c('Alt').t`Rotate camera`}
                        size={5}
                        buttonStyle={{
                            'padding-block': 0,
                            'padding-inline': 0,
                            width: '2.5rem',
                            height: '2.5rem',
                        }}
                    />
                )}
            </div>
        </div>
    );
};

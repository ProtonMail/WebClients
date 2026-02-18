import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcMeetUsers } from '@proton/icons/icons/IcMeetUsers';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setUpsellModalType } from '@proton/meet/store/slices';
import { UpsellModalTypes } from '@proton/meet/types/types';

import './MeetingRow.scss';

export const PersonalMeetingRowUpsell = () => {
    const dispatch = useMeetDispatch();

    const handleJoin = () => {
        dispatch(setUpsellModalType(UpsellModalTypes.PersonalMeeting));
    };

    return (
        <>
            <div
                className="meeting-row border w-full flex flex-column md:flex-row flex-nowrap justify-center items-start md:items-center md:justify-space-between gap-6 min-h-custom p-4 md:p-6 h-fit-content shrink-0 relative meeting-row--first personal-meeting-row"
                style={{ '--min-h-custom': '6.75rem' }}
            >
                <div className="flex flex-column md:flex-row items-start md:items-center shrink-0 gap-6">
                    <div
                        className="flex flex-column items-center justify-center w-custom h-custom meet-room-background-1 profile-radius color-white"
                        style={{ '--w-custom': '3.75rem', '--h-custom': '3.75rem' }}
                    >
                        <IcMeetUsers size={6} />
                    </div>
                    <div className="flex flex-column gap-1">
                        <div className="text-lg color-norm text-semibold text-break">{c('Title')
                            .t`Personal meeting room`}</div>
                        <div className="flex items-center gap-2">
                            <span className="color-hint">{c('Info').t`Your always available meeting room`}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    <div
                        className="hidden-meeting-row-actions absolute top-custom right-custom md:static gap-2 items-center color-norm flex"
                        style={{
                            '--top-custom': '0.75rem',
                            '--right-custom': '0.75rem',
                        }}
                    >
                        <Button
                            className="action-button-new meeting-row-action color-norm rounded-full copy-link-button flex-1 md:flex-none flex justify-center items-center"
                            size="medium"
                            shape="ghost"
                            disabled
                            icon
                        >
                            <IcArrowsRotate alt={c('Alt').t`Rotate personal meeting link`} />
                        </Button>
                    </div>
                    <Button
                        className="action-button-new meeting-row-action color-norm rounded-full copy-link-button flex-1 md:flex-none flex justify-center items-center md:mr-2"
                        size="medium"
                        shape="ghost"
                        disabled
                        icon
                    >
                        <IcSquares alt={c('Action').t`Copy meeting link`} />
                    </Button>
                    <Button
                        className="join-button action-button-new color-norm rounded-full join-button flex-1 md:flex-none flex items-center justify-center"
                        onClick={handleJoin}
                    >
                        {c('Action').t`Join`}
                    </Button>
                </div>
            </div>
        </>
    );
};

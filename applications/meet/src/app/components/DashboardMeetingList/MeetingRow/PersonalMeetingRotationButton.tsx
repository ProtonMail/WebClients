import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import clsx from '@proton/utils/clsx';

import { getRotatePersonalMeetingDisabledUntil } from '../../../utils/disableRotatePersonalMeeting';

interface PersonalMeetingRotationButtonProps {
    loadingRotatePersonalMeeting: boolean;
    handleRotatePersonalMeeting: () => void;
}

const getIsRotationDisabled = () => {
    const disabledUntil = getRotatePersonalMeetingDisabledUntil();
    return !!disabledUntil && disabledUntil > Date.now();
};

export const PersonalMeetingRotationButton = ({
    loadingRotatePersonalMeeting,
    handleRotatePersonalMeeting,
}: PersonalMeetingRotationButtonProps) => {
    const [isRotationDisabled, setIsRotationDisabled] = useState(getIsRotationDisabled);

    useEffect(() => {
        const interval = setInterval(() => setIsRotationDisabled(getIsRotationDisabled()), 30_000);
        return () => clearInterval(interval);
    }, []);

    const handleRotate = () => {
        setIsRotationDisabled(true);
        handleRotatePersonalMeeting();
    };

    return (
        <Tooltip
            title={
                isRotationDisabled
                    ? c('Tooltip').t`You can generate a new meeting link once per day.`
                    : c('Tooltip').t`Generate a new meeting link. The current link will stop working.`
            }
            disabled={loadingRotatePersonalMeeting}
            openDelay={200}
            closeDelay={0}
        >
            <span className="inline-block">
                <Button
                    className={clsx(
                        'action-button-new meeting-row-action color-norm rounded-full flex-1 md:flex-none flex justify-center items-center',
                        loadingRotatePersonalMeeting && 'icon-rotating'
                    )}
                    size="medium"
                    shape="ghost"
                    icon
                    onClick={handleRotate}
                    disabled={loadingRotatePersonalMeeting || isRotationDisabled}
                >
                    <IcArrowsRotate alt={c('Action').t`Rotate personal meeting link`} />
                </Button>
            </span>
        </Tooltip>
    );
};

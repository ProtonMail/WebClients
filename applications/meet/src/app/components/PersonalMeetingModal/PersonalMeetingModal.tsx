import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcArrowsRotate } from '@proton/icons';
import { useFlag } from '@proton/unleash';

import { getRotatePersonalMeetingDisabledUntil } from '../../utils/disableRotatePersonalMeeting';

import './PersonalMeetingModal.scss';

interface PersonalMeetingModalProps {
    onClose: () => void;
    onJoin: () => void;
    onCopyLink: () => void;
    onRotate: () => void;
    link: string;
    loadingRotatePersonalMeeting: boolean;
}

export const PersonalMeetingModal = ({
    onClose,
    onJoin,
    onCopyLink,
    onRotate,
    link,
    loadingRotatePersonalMeeting,
}: PersonalMeetingModalProps) => {
    const isPersonalMeetingRotationEnabled = useFlag('PersonalMeetingRotation');

    const [isRotateButtonDisabled, setIsRotateButtonDisabled] = useState(() => {
        const disabledUntil = getRotatePersonalMeetingDisabledUntil();
        if (!disabledUntil) {
            return false;
        }
        const now = Date.now();
        return disabledUntil > now;
    });

    const handleRotate = () => {
        setIsRotateButtonDisabled(true);
        onRotate();
    };

    const checkDisableStatus = () => {
        const disabledUntil = getRotatePersonalMeetingDisabledUntil();
        if (!disabledUntil) {
            setIsRotateButtonDisabled(false);
            return;
        }
        const now = Date.now();
        setIsRotateButtonDisabled(disabledUntil > now);
    };

    useEffect(() => {
        const interval = setInterval(checkDisableStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ModalTwo open={true} rootClassName="personal-meeting-modal" className="meet-radius" onClose={onClose}>
            <ModalTwoHeader />

            <ModalTwoContent className="flex flex-column justify-space-between mx-4 gap-6">
                <div className="text-center text-3xl text-semibold">{c('Title').t`Personal meeting`}</div>
                <div className="color-weak text-center">{c('Info')
                    .t`Your always available meeting room, share it only with people you trust.`}</div>

                <div className="flex flex-row bg-weak border border-norm p-6 rounded-xl">
                    <div className="flex flex-column flex-1">
                        <div className="color-weak">{c('Info').t`Your personal link`}</div>
                        <Href href={link} className={'text-break-all'}>
                            {link}
                        </Href>
                    </div>
                    {isPersonalMeetingRotationEnabled && (
                        <div className="flex flex-column justify-center">
                            <button
                                className="refresh-button rounded-50 p-2 ml-2 flex flex-column justify-center items-center border border-norm"
                                title={c('Action').t`Refresh link`}
                                onClick={handleRotate}
                                disabled={loadingRotatePersonalMeeting || isRotateButtonDisabled}
                            >
                                <IcArrowsRotate
                                    size={5}
                                    className={`shrink-0 no-print ${loadingRotatePersonalMeeting ? 'rotating' : ''}`}
                                    alt={c('Alt').t`Rotate personal meeting link`}
                                />
                            </button>
                        </div>
                    )}
                </div>
                <div className="w-full flex flex-column justify-end gap-2">
                    <Button
                        className="border-none rounded-full w-full text-semibold py-4 join-button"
                        onClick={onJoin}
                        size="large"
                    >
                        {c('Action').t`Join`}
                    </Button>
                    <Button
                        className="border-none rounded-full w-full text-semibold color-norm py-4 copy-button"
                        onClick={onCopyLink}
                        size="large"
                    >
                        {c('Action').t`Copy link`}
                    </Button>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

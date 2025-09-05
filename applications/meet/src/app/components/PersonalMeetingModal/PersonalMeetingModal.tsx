import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import './PersonalMeetingModal.scss';

interface PersonalMeetingModalProps {
    onClose: () => void;
    onJoin: () => void;
    onCopyLink: () => void;
    link: string;
}

export const PersonalMeetingModal = ({ onClose, onJoin, onCopyLink, link }: PersonalMeetingModalProps) => {
    return (
        <ModalTwo open={true} rootClassName="personal-meeting-modal" className="meet-radius" onClose={onClose}>
            <ModalTwoHeader />

            <ModalTwoContent className="flex flex-column justify-space-between mx-4 gap-6">
                <div className="text-center text-3xl text-semibold">{c('Title').t`Personal meeting`}</div>
                <div className="color-weak text-center">{c('Info')
                    .t`Your always available meeting room, share it only with people you trust.`}</div>

                <div className="flex flex-column bg-weak border border-norm p-6 rounded-xl">
                    <div className="color-weak">{c('Info').t`Your personal link`}</div>

                    <Href href={link}>{link}</Href>
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

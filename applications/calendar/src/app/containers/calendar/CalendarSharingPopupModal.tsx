import { useEffect } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PrimaryButton,
} from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import img from '@proton/styles/assets/img/illustrations/calendar-share.svg';

interface Props extends ModalProps {
    onDisplayed: () => void;
}

const CalendarSharingPopupModal = ({ onDisplayed, ...rest }: Props) => {
    useEffect(() => {
        if (rest.open) {
            onDisplayed();
        }
    }, [rest.open]);

    return (
        <Modal {...rest} size="small">
            <ModalHeader title={c('Title; calendar sharing pop-up').t`Planning just got easier!`} />
            <ModalContent>
                <img className="w-full" src={img} alt="" />
                <div className="my-4">{c('Info; calendar sharing pop-up')
                    .t`Invite others with a ${BRAND_NAME} account to view or edit events in your calendar.`}</div>
                <Href href={getKnowledgeBaseUrl('/share-calendar-with-proton-users')}>{c('Link').t`Learn more`}</Href>
            </ModalContent>
            <ModalFooter className="justify-end">
                <PrimaryButton onClick={rest.onClose}>{c('Action').t`Got it`}</PrimaryButton>
            </ModalFooter>
        </Modal>
    );
};

export default CalendarSharingPopupModal;

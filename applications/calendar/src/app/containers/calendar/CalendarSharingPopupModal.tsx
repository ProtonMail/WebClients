import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '@proton/components/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

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
        <Modal {...rest} size="medium">
            <ModalHeader title={c('Title; calendar sharing pop-up').t`Planning just got easier!`} />
            <ModalContent>
                <p>{c('Info; calendar sharing pop-up')
                    .t`Invite others with a ${BRAND_NAME} account to view or edit events in your calendar.`}</p>
                <Href href={getKnowledgeBaseUrl('/share-calendar-with-proton-users')}>{c('Link').t`Learn more`}</Href>
            </ModalContent>
            <ModalFooter className="flex-justify-end">
                <Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default CalendarSharingPopupModal;

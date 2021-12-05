import { c } from 'ttag';
import { Alert, Button, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

interface Props {
    onClose: () => void;
    duplicateAttendees: string[][];
    isOpen: boolean;
}

const DuplicateAttendeesModal = ({ onClose, duplicateAttendees, isOpen }: Props) => {
    return (
        <ModalTwo onSubmit={onClose} open={isOpen} onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`You have invited participants with equivalent emails`} />
            <ModalTwoContent>
                <p>{c('Info').t`Please remove the duplicates and try again.`}</p>
                {duplicateAttendees.map((group) => (
                    <Alert className="mb1" type="warning" key={group.join('')}>
                        {group.map((email) => (
                            <p className="text-ellipsis" key={email} title={email}>
                                {email}
                            </p>
                        ))}
                    </Alert>
                ))}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" className="mlauto" onClick={onClose}>{c('Action').t`OK`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DuplicateAttendeesModal;

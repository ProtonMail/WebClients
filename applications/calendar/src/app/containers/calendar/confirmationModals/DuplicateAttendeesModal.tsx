import { c } from 'ttag';
import { Alert, BasicModal, Button } from '@proton/components';

interface Props {
    onClose: () => void;
    duplicateAttendees: string[][];
    isOpen: boolean;
}

const DuplicateAttendeesModal = ({ onClose, duplicateAttendees, isOpen }: Props) => {
    return (
        <BasicModal
            title={c('Title').t`You have invited participants with equivalent emails`}
            footer={<Button color="norm" className="mlauto" onClick={onClose}>{c('Action').t`OK`}</Button>}
            onSubmit={onClose}
            isOpen={isOpen}
            onClose={onClose}
        >
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
        </BasicModal>
    );
};

export default DuplicateAttendeesModal;

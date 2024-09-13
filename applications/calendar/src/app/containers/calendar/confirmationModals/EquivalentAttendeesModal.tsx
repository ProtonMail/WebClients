import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, BasicModal } from '@proton/components';

interface Props {
    onClose: () => void;
    equivalentAttendees: string[][];
    isOpen: boolean;
}

const EquivalentAttendeesModal = ({ onClose, equivalentAttendees, isOpen }: Props) => {
    return (
        <BasicModal
            title={c('Title').t`You have invited participants with equivalent emails`}
            footer={<Button color="norm" className="ml-auto" onClick={onClose}>{c('Action').t`OK`}</Button>}
            onSubmit={onClose}
            isOpen={isOpen}
            onClose={onClose}
        >
            <p>{c('Info').t`Please remove the duplicates and try again.`}</p>
            {equivalentAttendees.map((group) => (
                <Alert className="mb-4" type="warning" key={group.join('')}>
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

export default EquivalentAttendeesModal;

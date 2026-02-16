import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props {
    onClose: () => void;
    equivalentAttendees: string[][];
    isOpen: boolean;
}

const EquivalentAttendeesModal = ({ onClose, equivalentAttendees, isOpen }: Props) => {
    return (
        <Prompt
            title={c('Title').t`You have invited participants with equivalent emails`}
            buttons={<Button color="norm" className="ml-auto" onClick={onClose}>{c('Action').t`OK`}</Button>}
            open={isOpen}
            onSubmit={onClose}
            onClose={onClose}
        >
            <p>{c('Info').t`Please remove the duplicates and try again.`}</p>
            <ul className="unstyled">
                {equivalentAttendees.map((group) => (
                    <li className="mb-4 p-2 border border-weak rounded" key={group.join('')}>
                        <ul className="unstyled">
                            {group.map((email) => (
                                <li className="text-ellipsis" key={email} title={email}>
                                    {email}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </Prompt>
    );
};

export default EquivalentAttendeesModal;

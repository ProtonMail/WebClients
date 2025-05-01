import { c } from 'ttag';

import { Banner, BannerVariants, Button } from '@proton/atoms';
import { Prompt } from '@proton/components';

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
            {equivalentAttendees.map((group) => (
                <Banner className="mb-4" variant={BannerVariants.WARNING_OUTLINE} key={group.join('')}>
                    {group.map((email) => (
                        <p className="text-ellipsis m-0" key={email} title={email}>
                            {email}
                        </p>
                    ))}
                </Banner>
            ))}
        </Prompt>
    );
};

export default EquivalentAttendeesModal;

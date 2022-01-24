import { MouseEvent } from 'react';
import { c } from 'ttag';

import { ACCESS_LEVEL } from '@proton/shared/lib/interfaces/calendar';

import { BasicModal, Button, InputTwo } from '../../../components';

interface Props {
    link: string;
    onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
    onClose: () => void;
    accessLevel: ACCESS_LEVEL;
    isOpen: boolean;
}

const ShareLinkSuccessModal = ({ link, onSubmit, onClose, accessLevel, isOpen }: Props) => {
    return (
        <BasicModal
            title={c('Title').t`Your calendar link`}
            footer={<Button className="mlauto" onClick={onSubmit} color="norm">{c('Action').t`Copy link`}</Button>}
            size="medium"
            onClose={onClose}
            isOpen={isOpen}
        >
            {accessLevel === ACCESS_LEVEL.FULL ? (
                <>
                    <p className="mt0">{c('Info')
                        .t`By sharing the full event details of this calendar, you accept to grant Proton access to this calendar's encrypted information.`}</p>
                    <p>{c('Info')
                        .t`Anyone with this link can see all the event details of this calendar such as title, location or participants.`}</p>
                </>
            ) : (
                <p className="mt0">
                    {c('Info')
                        .t`Anyone with this link can see whether you’re free or busy on your calendar. They can’t see event details, such as title, location, or participants.`}
                </p>
            )}
            <label htmlFor="your-calendar-url" className="sr-only">
                {c('Label').t`Your calendar URL`}
            </label>
            <InputTwo id="your-calendar-url" value={link} />
        </BasicModal>
    );
};

export default ShareLinkSuccessModal;

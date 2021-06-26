import React, { MouseEvent } from 'react';
import { c } from 'ttag';

import { ACCESS_LEVEL } from '@proton/shared/lib/interfaces/calendar';

import { FormModal, Input } from '../../../components';

interface Props {
    link: string;
    onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
    accessLevel: ACCESS_LEVEL;
}

const ShareLinkSuccessModal = ({ link, onSubmit, accessLevel, ...rest }: Props) => {
    return (
        <FormModal
            title={c('Title').t`Your calendar link`}
            onSubmit={onSubmit}
            close={null}
            submit={c('Action').t`Copy link`}
            {...rest}
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
            <Input id="your-calendar-url" value={link} />
        </FormModal>
    );
};

export default ShareLinkSuccessModal;

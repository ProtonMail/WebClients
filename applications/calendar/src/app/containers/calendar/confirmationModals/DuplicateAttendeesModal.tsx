import React from 'react';
import { c } from 'ttag';
import { Alert, FormModal } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

interface Props {
    onClose: () => void;
    duplicateAttendees: string[][];
}

const DuplicateAttendeesModal = ({ onClose, duplicateAttendees, ...rest }: Props) => {
    return (
        <FormModal
            submit={c('Action').t`OK`}
            close={null}
            title={c('Title').t`You have invited participants with equivalent emails`}
            onSubmit={onClose}
            onClose={noop}
            hasClose={false}
            noTitleEllipsis
            small
            {...rest}
        >
            <p>{c('Info').t`Please remove the duplicates and try again.`}</p>
            {duplicateAttendees.map((group) => (
                <Alert type="warning" key={group.join('')}>
                    {group.map((email) => (
                        <p className="text-ellipsis" key={email} title={email}>
                            {email}
                        </p>
                    ))}
                </Alert>
            ))}
        </FormModal>
    );
};

export default DuplicateAttendeesModal;

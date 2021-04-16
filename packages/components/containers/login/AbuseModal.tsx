import React from 'react';
import { c } from 'ttag';
import { FormModal, Href } from '../../components';

interface Props {
    message?: string;
}

const AbuseModal = ({ message, ...rest }: Props) => {
    const contactLink = (
        <Href url="https://protonmail.com/abuse" key={1}>
            {c('Info').t`here`}
        </Href>
    );

    return (
        <FormModal
            hasClose={false}
            hasSubmit={false}
            title={c('Title').t`Account suspended`}
            small
            close={c('Action').t`Close`}
            {...rest}
        >
            {message || (
                <>
                    <div className="mb1">{c('Info')
                        .t`This account has been suspended due to a potential policy violation.`}</div>
                    <div>{c('Info').jt`If you believe this is in error, please contact us ${contactLink}.`}</div>
                </>
            )}
        </FormModal>
    );
};

export default AbuseModal;

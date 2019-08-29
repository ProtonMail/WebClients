import React from 'react';
import { FormModal, Alert, Href } from 'react-components';
import { c } from 'ttag';

const AbuseModal = (props) => {
    const title = c('Title').t`Account disabled`;

    const abuseOrFraudLink = (
        <Href url="https://protonmail.com/support/knowledge-base/account-disabled/" key={0}>
            {c('Info').t`abuse or fraud`}
        </Href>
    );

    const contactLink = (
        <Href url="https://protonmail.com/abuse" key={1}>
            {c('Info').t`here`}
        </Href>
    );

    return (
        <FormModal hasClose={false} hasSubmit={false} title={title} close={c('Action').t`Close`} {...props}>
            <Alert type="warning">
                <div className="mb1">{c('Info').jt`Account disabled due to ${abuseOrFraudLink}.`}</div>
                <div>{c('Info').jt`You can find more information and contact us ${contactLink}.`}</div>
            </Alert>
        </FormModal>
    );
};

export default AbuseModal;

import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, PrimaryButton, Button, Block, LearnMore, useModal } from 'react-components';

import DomainModal from './DomainModal';

const DomainsSection = () => {
    const { isOpen: showDomainModal, open: openDomainModal, close: closeDomainModal } = useModal();
    const handleRefresh = () => {};

    return (
        <>
            <SubTitle>{c('Title').t`Domains`}</SubTitle>
            <Alert>
                {c('Message')
                    .t`Add a custom filter to perform actions such as automatically labeling or archiving messages.`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block>
                <PrimaryButton onClick={openDomainModal}>{c('Action').t`Add domain`}</PrimaryButton>
                <DomainModal show={showDomainModal} onClose={closeDomainModal} />
                <Button onClick={handleRefresh}>{c('Action').t`Refresh status`}</Button>
            </Block>
        </>
    );
};

export default DomainsSection;

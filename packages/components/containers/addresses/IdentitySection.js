import React, { useState } from 'react';
import { c } from 'ttag';
import { SmallButton, SubTitle, Label, Select, Text, Row, useAddresses, useModal } from 'react-components';
import { ADDRESS_STATUS, RECEIVE_ADDRESS, SEND_ADDRESS } from 'proton-shared/lib/constants';

import EditAddressModal from './EditAddressModal';
import PMSignatureToggle from './PMSignatureToggle';

const IdentitySection = () => {
    const [addresses] = useAddresses();
    const { isOpen, open, close } = useModal();

    const options = addresses
        .filter(
            ({ Status, Receive, Send }) =>
                Status === ADDRESS_STATUS.STATUS_ENABLED &&
                Receive === RECEIVE_ADDRESS.RECEIVE_YES &&
                Send === SEND_ADDRESS.SEND_YES
        )
        .map(({ ID: value, Email: text }) => ({ text, value }));
    const [address, setAddress] = useState(addresses[0]);
    const handleChange = ({ target }) => setAddress(addresses.find(({ ID }) => ID === target.value));

    return (
        <>
            <SubTitle>{c('Title').t`Identity`}</SubTitle>
            <EditAddressModal show={isOpen} onClose={close} address={address} />
            <Row>
                <Label htmlFor="addressSelector">{c('Label').t`Select an address`}</Label>
                <Select id="addressSelector" options={options} onChange={handleChange} />
            </Row>
            <Row>
                <Label>{c('Label').t`Display name`}</Label>
                <div className="flex flex-spacebetween">
                    <Text>{address.DisplayName}</Text>
                    <SmallButton onClick={open}>{c('Action').t`Edit`}</SmallButton>
                </div>
            </Row>
            <Row>
                <Label>{c('Label').t`Signature`}</Label>
                <div className="flex flex-spacebetween">
                    <div className="pm-label" dangerouslySetInnerHTML={{ __html: address.Signature }} />
                    <SmallButton onClick={open}>{c('Action').t`Edit`}</SmallButton>
                </div>
            </Row>
            <Row>
                <Label htmlFor="pmSignatureToggle">{c('Label').t`ProtonMail signature`}</Label>
                <PMSignatureToggle id="pmSignatureToggle" />
            </Row>
        </>
    );
};

export default IdentitySection;

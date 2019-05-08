import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    SmallButton,
    SubTitle,
    Label,
    Select,
    Info,
    Row,
    Field,
    Loader,
    useAddresses,
    useModal
} from 'react-components';
import { ADDRESS_STATUS, RECEIVE_ADDRESS, SEND_ADDRESS } from 'proton-shared/lib/constants';

import EditAddressModal from './EditAddressModal';
import PMSignatureToggle from './PMSignatureToggle';

const IdentitySection = () => {
    const title = <SubTitle>{c('Title').t`Identity`}</SubTitle>;
    const [addresses = [], loading] = useAddresses();
    const { isOpen, open, close } = useModal();
    const [address, setAddress] = useState();

    useEffect(() => {
        if (addresses.length) {
            const [address] = addresses;
            setAddress(address);
        }
    }, [loading]);

    if (loading || !address) {
        return (
            <>
                {title}
                <Loader />
            </>
        );
    }

    const options = addresses
        .filter(
            ({ Status, Receive, Send }) =>
                Status === ADDRESS_STATUS.STATUS_ENABLED &&
                Receive === RECEIVE_ADDRESS.RECEIVE_YES &&
                Send === SEND_ADDRESS.SEND_YES
        )
        .map(({ ID: value, Email: text }) => ({ text, value }));

    const handleChange = ({ target }) => setAddress(addresses.find(({ ID }) => ID === target.value));

    return (
        <>
            {title}
            {isOpen ? <EditAddressModal onClose={close} address={address} /> : null}
            <Row>
                <Label htmlFor="addressSelector">{c('Label').t`Select an address`}</Label>
                <Field>
                    <Select id="addressSelector" options={options} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label>
                    {c('Label').t`Display name`}{' '}
                    <Info url="https://protonmail.com/support/knowledge-base/display-name-and-signature/" />
                </Label>
                <Field className="flex flex-spacebetween">
                    {address.DisplayName}{' '}
                    <SmallButton className="pm-button--primary" onClick={open}>{c('Action').t`Edit`}</SmallButton>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Signature`}</Label>
                <Field>
                    <div className="pm-label mb1" dangerouslySetInnerHTML={{ __html: address.Signature }} />
                    <SmallButton className="pm-button--primary" onClick={open}>{c('Action').t`Edit`}</SmallButton>
                </Field>
            </Row>
            <Row>
                <Label htmlFor="pmSignatureToggle">{c('Label').t`ProtonMail signature`}</Label>
                <Field>
                    <PMSignatureToggle id="pmSignatureToggle" />
                </Field>
            </Row>
        </>
    );
};

export default IdentitySection;

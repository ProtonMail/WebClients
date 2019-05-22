import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Alert,
    Button,
    SubTitle,
    Label,
    Select,
    Info,
    Row,
    Field,
    Loader,
    useAddresses,
    useModals
} from 'react-components';
import { ADDRESS_STATUS, RECEIVE_ADDRESS, SEND_ADDRESS } from 'proton-shared/lib/constants';

import EditAddressModal from './EditAddressModal';
import PMSignatureToggle from './PMSignatureToggle';

const IdentitySection = () => {
    const [addresses = [], loading] = useAddresses();
    const { createModal } = useModals();
    const [address, setAddress] = useState();

    useEffect(() => {
        if (addresses.length) {
            const [address] = addresses;
            setAddress(address);
        }
    }, [loading]);

    useEffect(() => {
        if (!addresses.length || !address) {
            return;
        }
        // Update the address when the event manager triggers
        const newAddress = addresses.find(({ ID }) => ID === address.ID);
        if (newAddress) {
            return setAddress(newAddress);
        }
        setAddress(addresses[0]);
    }, [addresses]);

    const title = <SubTitle>{c('Title').t`Display name & signature`}</SubTitle>;

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

    const handleOpenModal = () => createModal(<EditAddressModal address={address} />);

    return (
        <>
            {title}
            <Alert>{c('Info').t`TODO`}</Alert>
            <Row>
                <Label htmlFor="addressSelector">{c('Label').t`Select an address`}</Label>
                <Field>
                    <Select id="addressSelector" options={options} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Display name`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/display-name-and-signature/" />
                </Label>
                <Field className="flex flex-spacebetween">
                    <span className="mt0-5 mr1">{address.DisplayName}</span>
                    <Button className="pm-button--primary" onClick={handleOpenModal}>{c('Action').t`Edit`}</Button>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Signature`}</Label>
                <Field>
                    <div
                        className="bordered-container p1 mb1"
                        dangerouslySetInnerHTML={{ __html: address.Signature }}
                    />
                    <Button className="pm-button--primary" onClick={handleOpenModal}>{c('Action').t`Edit`}</Button>
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

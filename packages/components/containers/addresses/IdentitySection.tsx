import React, { ChangeEvent, useState } from 'react';
import { c } from 'ttag';
import { ADDRESS_STATUS, RECEIVE_ADDRESS, SEND_ADDRESS } from 'proton-shared/lib/constants';
import { Alert, Button, Label, Select, Info, Row, Field, Loader } from '../../components';
import { useAddresses, useModals } from '../../hooks';

import EditAddressModal from './EditAddressModal';

const IdentitySection = () => {
    const [addresses, loading] = useAddresses();
    const [addressIndex, setAddressIndex] = useState(0);
    const { createModal } = useModals();

    if (loading && !Array.isArray(addresses)) {
        return <Loader />;
    }

    const filtered = addresses.filter(
        ({ Status, Receive, Send }) =>
            Status === ADDRESS_STATUS.STATUS_ENABLED &&
            Receive === RECEIVE_ADDRESS.RECEIVE_YES &&
            Send === SEND_ADDRESS.SEND_YES
    );

    if (!filtered.length) {
        return <Alert>{c('Info').t`No addresses exist`}</Alert>;
    }

    const address = filtered[addressIndex];
    const options = filtered.map(({ Email: text }, index) => ({ text, value: index }));
    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => setAddressIndex(+target.value);
    const handleOpenModal = () => createModal(<EditAddressModal address={address} />);

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/display-name-and-signature/">{c('Info')
                .t`Click the Edit button to personalize your email address. Your Display Name appears in the From field when people receive an email from you. Your Signature is appended at the bottom of your messages. Or leave each field empty for more privacy.`}</Alert>
            <Row>
                <Label htmlFor="addressSelector">{c('Label').t`Select an address`}</Label>
                <Field>
                    <Select id="addressSelector" options={options} onChange={handleChange} />
                </Field>
            </Row>
            <Row>
                <Label>
                    <span className="mr0-5">{c('Label').t`Display name`}</span>
                    <Info url="https://protonmail.com/support/knowledge-base/display-name-and-signature/" />
                </Label>
                <Field className="bordered-container">
                    <div className="pl1 pr1 pt0-5 pb0-5 ellipsis" title={address.DisplayName}>
                        {address.DisplayName}
                    </div>
                </Field>
                <span className="ml1 onmobile-ml0 onmobile-mt0-5">
                    <Button className="pm-button--primary" onClick={handleOpenModal}>{c('Action').t`Edit`}</Button>
                </span>
            </Row>
            <Row>
                <Label>{c('Label').t`Signature`}</Label>
                <Field className="bordered-container">
                    {address.Signature ? (
                        <div
                            className="break pl1 pr1 pt0-5 pb0-5"
                            dangerouslySetInnerHTML={{ __html: address.Signature }}
                        />
                    ) : (
                        <div className="pl1 pr1 pt0-5 pb0-5">{c('Info').t`Not set`}</div>
                    )}
                </Field>
                <span className="ml1 onmobile-ml0 onmobile-mt0-5">
                    <Button className="pm-button--primary" onClick={handleOpenModal}>{c('Action').t`Edit`}</Button>
                </span>
            </Row>
        </>
    );
};

export default IdentitySection;

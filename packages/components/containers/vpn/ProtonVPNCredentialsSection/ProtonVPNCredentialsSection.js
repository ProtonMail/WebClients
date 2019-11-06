import React from 'react';
import { SubTitle, Row, Label, Field, Alert, Href, useUser } from 'react-components';
import { c } from 'ttag';

const ProtonVPNCredentialsSection = () => {
    const [user] = useUser();

    const username = user.isMember ? user.Email : user.Name;

    const downloadLink = (
        <Href key="link" className="mr0-5" url="https://protonvpn.com/download">{c('Link')
            .t`ProtonVPN native clients`}</Href>
    );

    return (
        <>
            <SubTitle>{c('Title').t`ProtonVPN credentials`}</SubTitle>
            <Alert>{c('Info').jt`Use the following credentials to log into the ${downloadLink}.`}</Alert>
            <Row>
                <Label>{c('Label').t`Proton username`}</Label>
                <Field className="mt0-5">
                    <strong>{username}</strong>
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Password`}</Label>
                <Field className="mt0-5">
                    <strong>{c('Info').t`Same as ProtonMail login password`}</strong>
                </Field>
            </Row>
        </>
    );
};

export default ProtonVPNCredentialsSection;

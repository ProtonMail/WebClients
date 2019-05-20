import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, Field, Alert, useUser } from 'react-components';
import { Link } from 'react-router-dom';

const UsernameSection = () => {
    const [{ Name }] = useUser();
    const link = <Link key="linkIdentity" to="/settings/identity">{c('Link').t`identity settings`}</Link>;

    return (
        <>
            <SubTitle>{c('Title').t`Username`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Name`}</Label>
                <Field>
                    <strong>{Name}</strong>
                </Field>
            </Row>
            <Alert>{c('Info').jt`To manage your display name and signature, go to ${link}.`}</Alert>
        </>
    );
};

export default UsernameSection;

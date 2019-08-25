import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, Field, useUser } from 'react-components';

const UsernameSection = () => {
    const [{ Name }] = useUser();

    return (
        <>
            <SubTitle>{c('Title').t`Username`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Name`}</Label>
                <Field className="pt0-5">
                    <strong>{Name}</strong>
                </Field>
            </Row>
        </>
    );
};

export default UsernameSection;

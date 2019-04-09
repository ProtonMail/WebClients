import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, Text, useUser } from 'react-components';
import { Link } from 'react-router-dom';

const UsernameSection = () => {
    const [{ Name }] = useUser();
    const link = <Link to="/settings/identity">{c('Link').t`identity settings`}</Link>;

    return (
        <>
            <SubTitle>{c('Title').t`Username`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Name`}</Label>
                <div>
                    <Text className="bold">{Name}</Text>
                    <br />
                    <Text>{c('Info').jt`To manage your display name and signature, go to ${link}.`}</Text>
                </div>
            </Row>
        </>
    );
};

export default UsernameSection;

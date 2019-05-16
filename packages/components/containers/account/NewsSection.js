import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, Label, Row, Field, useSubscription, useUser, MozillaInfoPanel } from 'react-components';
import NewsCheckboxes from './NewsCheckboxes';

const NewsSection = () => {
    const [{ isManagedByMozilla }] = useSubscription();
    const [{ isMember }] = useUser();

    if (isMember) {
        return null;
    }

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Email subscriptions`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    return (
        <>
            <SubTitle>{c('Title').t`Email subscriptions`}</SubTitle>
            <Alert>{c('Info')
                .t`To keep up with the latest development at Protonmail, you can subscribe to our various emails and visit our blog from time to time.`}</Alert>
            <Row>
                <Label>{c('Label').t`Email subscriptions`}</Label>
                <Field>
                    <NewsCheckboxes />
                </Field>
            </Row>
        </>
    );
};

export default NewsSection;

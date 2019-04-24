import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, useSubscription, useUser, MozillaInfoPanel } from 'react-components';
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
            <Row>
                <Label>{c('Label').t`Email subscriptions`}</Label>
                <NewsCheckboxes />
            </Row>
        </>
    );
};

export default NewsSection;

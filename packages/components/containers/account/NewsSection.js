import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row } from 'react-components';
import NewsCheckboxes from './NewsCheckboxes';

const NewsSection = () => {
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

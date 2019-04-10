import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, ObserverSection } from 'react-components';
import NewsCheckboxes from './NewsCheckboxes';

const NewsSection = () => {
    return (
        <ObserverSection id="news">
            <SubTitle>{c('Title').t`Email subscriptions`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Email subscriptions`}</Label>
                <NewsCheckboxes />
            </Row>
        </ObserverSection>
    );
};

export default NewsSection;

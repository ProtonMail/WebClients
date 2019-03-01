import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, Row, Label } from 'react-components';

import DraftTypeSelect from './DraftTypeSelect';
import TextDirectionSelect from './TextDirectionSelect';
import ShowMovedSelect from './ShowMovedSelect';
import ComposerModeRadios from './ComposerModeRadios';
import ViewLayoutRadios from './ViewLayoutRadios';
import ViewModeRadios from './ViewModeRadios';

const LayoutsSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Layouts`}</SubTitle>
            <Alert>{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label>{c('Label').t`Default Composer`}</Label>
                <ComposerModeRadios />
            </Row>
            <Row>
                <Label>{c('Label').t`Default Inbox`}</Label>
                <ViewLayoutRadios />
            </Row>
            <Row>
                <Label>{c('Label').t`Conversations`}</Label>
                <ViewModeRadios />
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Mode`}</Label>
                <DraftTypeSelect />
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Text Direction`}</Label>
                <TextDirectionSelect />
            </Row>
            <Row>
                <Label>{c('Label').t`Sent/Drafts`}</Label>
                <ShowMovedSelect />
            </Row>
        </>
    );
};

export default LayoutsSection;

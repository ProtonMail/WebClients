import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, Row, Label, Info } from 'react-components';

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
                <Label>
                    <span className="mr1">{c('Label').t`Default Composer`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/composer/"
                        title={c('Tooltip')
                            .t`This sets the default composer size. Two sizes are available, a smaller popup composer, and a bigger full screen composer.`}
                    />
                </Label>
                <ComposerModeRadios />
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Default Inbox`}</span>
                    <Info
                        url="https://protonmail.com/support/knowledge-base/change-inbox-layout/"
                        title={c('Tooltip')
                            .t`ProtonMail supports both column and row layouts for the inbox. Using this setting, it is possible to change between the two layouts.`}
                    />
                </Label>
                <ViewLayoutRadios />
            </Row>
            <Row>
                <Label>
                    <span className="mr1">{c('Label').t`Conversations`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Conversation Grouping automatically groups messages in the same conversation together.`}
                    />
                </Label>
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
                <Label>
                    <span className="mr1">{c('Label').t`Sent/Drafts`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Setting to 'Include Moved' means that sent / drafts messages that have been moved to other folders will continue to appear in the Sent/Drafts folder.`}
                    />
                </Label>
                <ShowMovedSelect />
            </Row>
        </>
    );
};

export default LayoutsSection;

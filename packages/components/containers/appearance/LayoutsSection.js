import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, Row, Label } from 'react-components';

const LayoutsSection = () => {
    const draftTypeOptions = [
        { text: c('Option').t`Normal`, value: 'text/html' },
        { text: c('Option').t`Plain Text`, value: 'text/plain' }
    ];

    const textDirectionOptions = [
        { text: c('Option').t`Left to Right`, value: 0 },
        { text: c('Option').t`Right to Left`, value: 1 }
    ];

    const movedOptions = [
        { text: c('Option').t`Include Moved`, value: 1 },
        { text: c('Option').t`Hide Moved`, value: 0 }
    ];

    const handleChangeDraftType = () => {};
    const handleChangeTextDirection = () => {};
    const handleChangeMoved = () => {};

    return (
        <>
            <SubTitle>{c('Title').t`Layouts`}</SubTitle>
            <Alert>{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label>{c('Label').t`Default Composer`}</Label>
            </Row>
            <Row>
                <Label>{c('Label').t`Default Inbox`}</Label>
            </Row>
            <Row>
                <Label>{c('Label').t`Conversations`}</Label>
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Mode`}</Label>
                <Select options={draftTypeOptions} onChange={handleChangeDraftType} />
            </Row>
            <Row>
                <Label>{c('Label').t`Composer Text Direction`}</Label>
                <Select options={textDirectionOptions} onChange={handleChangeTextDirection} />
            </Row>
            <Row>
                <Label>{c('Label').t`Sent/Drafts`}</Label>
                <Select options={movedOptions} onChange={handleChangeMoved} />
            </Row>
        </>
    );
};

export default LayoutsSection;
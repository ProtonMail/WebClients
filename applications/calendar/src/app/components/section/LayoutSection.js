import React from 'react';
import { SubTitle, Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import { VIEWS, WEEK_START } from '../../constants';

const { DAY, WEEK, MONTH, YEAR, AGENDA } = VIEWS;
const { MONDAY, SATURDAY, SUNDAY } = WEEK_START;

const LayoutSection = () => {
    const viewOptions = [
        { text: c('Option').t`Day`, value: DAY },
        { text: c('Option').t`Week`, value: WEEK },
        { text: c('Option').t`Month`, value: MONTH },
        { text: c('Option').t`Year`, value: YEAR },
        { text: c('Option').t`Agenda`, value: AGENDA }
    ];

    const weekStartOptions = [
        { text: c('Week day').t`Saturday`, value: SATURDAY },
        { text: c('Week day').t`Sunday`, value: SUNDAY },
        { text: c('Week day').t`Monday`, value: MONDAY }
    ];

    return (
        <>
            <SubTitle>{c('Title').t`Layout`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Default view`}</Label>
                <Field>
                    <Select options={viewOptions} />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Week start`}</Label>
                <Field>
                    <Select options={weekStartOptions} />
                </Field>
            </Row>
        </>
    );
};

export default LayoutSection;

import React from 'react';
import { SubTitle, Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';
import { WEEK_START } from '../../constants';
import ViewSelector from '../ViewSelector';

const { MONDAY, SATURDAY, SUNDAY } = WEEK_START;

const LayoutSection = () => {
    const weekStartOptions = [
        { text: c('Week day').t`Saturday`, value: SATURDAY },
        { text: c('Week day').t`Sunday`, value: SUNDAY },
        { text: c('Week day').t`Monday`, value: MONDAY }
    ];

    return (
        <>
            <SubTitle>{c('Title').t`Layout`}</SubTitle>
            <Row>
                <Label htmlFor="view-select">{c('Label').t`Default view`}</Label>
                <Field>
                    <ViewSelector id="view-select" />
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

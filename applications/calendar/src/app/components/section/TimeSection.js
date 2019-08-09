import React from 'react';
import { SubTitle, Row, Label, Field, Select } from 'react-components';
import { c } from 'ttag';

const TimeSection = () => {
    return (
        <>
            <SubTitle>{c('Title').t`Region & time zone`}</SubTitle>
            <Row>
                <Label>{c('Label').t`Date format`}</Label>
                <Field>
                    <Select options={[]} />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Time format`}</Label>
                <Field>
                    <Select options={[]} />
                </Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Primary time`}</Label>
                <Field></Field>
            </Row>
            <Row>
                <Label>{c('Label').t`Secondary time`}</Label>
                <Field></Field>
            </Row>
        </>
    );
};

export default TimeSection;

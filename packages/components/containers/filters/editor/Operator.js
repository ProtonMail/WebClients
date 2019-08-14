import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Select, Row, Field } from 'react-components';
import { getI18n as getI18nFilter } from 'proton-shared/lib/filters/factory';
import { noop } from 'proton-shared/lib/helpers/function';

function OperatorEditor({ filter, onChange = noop }) {
    const { Operator } = filter.Simple;
    const { OPERATORS } = getI18nFilter();
    const options = OPERATORS.map(({ label: text, value }) => ({ text, value }));

    const handleChange = ({ target }) => {
        const operator = OPERATORS.find(({ value }) => target.value === value);
        onChange(operator);
    };

    return (
        <Row>
            <Label htmlFor="logic">{c('Label').t`Logic`}</Label>
            <Field>
                <Select
                    options={options}
                    name="logic"
                    onChange={handleChange}
                    className="mlauto"
                    defaultValue={Operator.value}
                />
            </Field>
        </Row>
    );
}

OperatorEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    onChange: PropTypes.func
};

export default OperatorEditor;

import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Label, Input, Row, ErrorZone } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

function NameEditor({ filter, onChange, error }) {
    const handleChange = ({ target }) => onChange(target.value);

    return (
        <Row>
            <Label htmlFor="filterName">{c('Filter label').t`Name`}</Label>
            <div className="w100">
                <Input
                    id="filterName"
                    type="text"
                    defaultValue={filter.Name}
                    onChange={handleChange}
                    placeholder={c('Placeholder').t`Name`}
                    required
                />
                {error.isEmpty ? <ErrorZone id="filterNameError">{c('Error').t`Username required`}</ErrorZone> : null}
            </div>
        </Row>
    );
}

NameEditor.propTypes = {
    filter: PropTypes.object.isRequired,
    error: PropTypes.object,
    onChange: PropTypes.func
};

NameEditor.defaultProps = {
    onChange: noop,
    error: {}
};

export default NameEditor;

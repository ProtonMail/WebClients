import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { FormModal, Label, Alert, TextArea } from 'react-components';

const CustomThemeModal = ({ onClose, onSave, theme: initialTheme = '', ...rest }) => {
    const [theme, setTheme] = useState(initialTheme);

    const handleChange = ({ target }) => setTheme(target.value);
    const handleSubmit = () => onSave(theme);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            submit={c('Action').t`Save`}
            close={c('Action').t`Cancel`}
            title={c('Title').t`Custom Theme`}
            small
            {...rest}
        >
            <Alert type="warning">{c('Warning')
                .t`Custom themes from third parties can potentially betray your privacy. Only use themes from trusted sources`}</Alert>
            <Label className="mb1" htmlFor="themeTextarea">{c('Label').t`CSS code`}</Label>
            <TextArea
                className="mb1"
                id="themeTextarea"
                value={theme}
                placeholder={c('Action').t`Insert CSS code here`}
                onChange={handleChange}
            />
        </FormModal>
    );
};

CustomThemeModal.propTypes = {
    onClose: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    theme: PropTypes.string
};

export default CustomThemeModal;

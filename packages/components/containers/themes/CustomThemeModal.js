import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { FormModal, PrimaryButton, Label, Alert, TextArea } from '../../components';

const CustomThemeModal = ({ onSave, theme: initialTheme = '', ...rest }) => {
    const [theme, setTheme] = useState(initialTheme);

    const handleChange = ({ target }) => setTheme(target.value);
    const handleSubmit = async () => {
        await onSave(theme);
        rest.onClose();
    };

    return (
        <FormModal
            submit={<PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>}
            onSubmit={handleSubmit}
            title={c('Title').t`Custom mode`}
            {...rest}
        >
            <Alert type="warning">{c('Warning')
                .t`Custom modes from third parties can potentially betray your privacy. Only use modes from trusted sources.`}</Alert>
            <Label className="block mb0-5" htmlFor="themeTextarea">{c('Label').t`CSS code`}</Label>
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
    onSave: PropTypes.func.isRequired,
    theme: PropTypes.string,
};

export default CustomThemeModal;

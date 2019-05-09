import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Modal,
    FooterModal,
    Label,
    ContentModal,
    InnerModal,
    Alert,
    TextArea,
    ResetButton,
    PrimaryButton
} from 'react-components';

const CustomThemeModal = ({ onClose, onSave, theme: initialTheme = '' }) => {
    const [theme, setTheme] = useState(initialTheme);
    const handleChange = ({ target }) => setTheme(target.value);
    const handleSubmit = () => onSave(theme);
    return (
        <Modal onClose={onClose} title={c('Title').t`Custom Theme`} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <InnerModal>
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
                </InnerModal>
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Action').t`Save`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

CustomThemeModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    theme: PropTypes.string
};

export default CustomThemeModal;

import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { COMPOSER_MODE } from 'proton-shared/lib/constants';
import composerPopUpSvg from 'design-system/assets/img/design-system-website/popup.svg';
import composerMaximizedSvg from 'design-system/assets/img/design-system-website/popup.svg';

const { POPUP, MAXIMIZED } = COMPOSER_MODE;

const ComposerModeRadios = ({ composerMode, handleChange, loading }) => {
    const radioCardPopup = {
        value: POPUP,
        checked: composerMode === POPUP,
        id: 'popupRadio',
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Popup`,
        onChange: handleChange(POPUP),
        children: <img alt="Popup" src={composerPopUpSvg} />
    };
    const radioCardMaximized = {
        value: MAXIMIZED,
        checked: composerMode === MAXIMIZED,
        id: 'maximizedRadio',
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Maximized`,
        onChange: handleChange(MAXIMIZED),
        children: <img alt="Maximized" src={composerMaximizedSvg} />
    };

    return <RadioCards list={[radioCardPopup, radioCardMaximized]} />;
};

ComposerModeRadios.propTypes = {
    composerMode: PropTypes.number.isRequired,
    handleChange: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default ComposerModeRadios;

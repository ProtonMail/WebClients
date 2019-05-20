import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { RadioCards } from 'react-components';
import { COMPOSER_MODE } from 'proton-shared/lib/constants';
import composerPopUpSvg from 'design-system/assets/img/pm-images/composer-popup.svg';
import composerMaximizedSvg from 'design-system/assets/img/pm-images/composer-maximized.svg';

const { POPUP, MAXIMIZED } = COMPOSER_MODE;

const ComposerModeRadios = ({ composerMode, onChange, loading, id, ...rest }) => {
    const radioCardPopup = {
        value: POPUP,
        checked: composerMode === POPUP,
        id: 'popupRadio',
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Popup`,
        onChange() {
            onChange(POPUP);
        },
        children: <img alt="Popup" src={composerPopUpSvg} />
    };
    const radioCardMaximized = {
        value: MAXIMIZED,
        checked: composerMode === MAXIMIZED,
        id: 'maximizedRadio',
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Maximized`,
        onChange() {
            onChange(MAXIMIZED);
        },
        children: <img alt="Maximized" src={composerMaximizedSvg} />
    };

    return <RadioCards list={[radioCardPopup, radioCardMaximized]} id={id} {...rest} />;
};

ComposerModeRadios.propTypes = {
    composerMode: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    id: PropTypes.string
};

export default ComposerModeRadios;

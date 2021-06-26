import React from 'react';
import { c } from 'ttag';

import { COMPOSER_MODE } from '@proton/shared/lib/constants';

import composerPopUpSvg from '@proton/styles/assets/img/pm-images/composer-popup.svg';
import composerMaximizedSvg from '@proton/styles/assets/img/pm-images/composer-maximized.svg';

import { LayoutCards } from '../../components';

const { POPUP, MAXIMIZED } = COMPOSER_MODE;

interface Props {
    composerMode: COMPOSER_MODE;
    onChange: (composerMode: COMPOSER_MODE) => void;
    loading: boolean;
    describedByID: string;
    className?: string;
    liClassName?: string;
}

const ComposerModeCards = ({
    composerMode,
    onChange,
    className,
    liClassName,
    loading,
    describedByID,
    ...rest
}: Props) => {
    const layoutCardPopup = {
        value: POPUP,
        selected: composerMode === POPUP,
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Normal`,
        onChange() {
            onChange(POPUP);
        },
        src: composerPopUpSvg,
        describedByID,
    };
    const layoutCardMaximized = {
        value: MAXIMIZED,
        selected: composerMode === MAXIMIZED,
        disabled: loading,
        name: 'composerMode',
        label: c('Label to change composer mode').t`Maximized`,
        onChange() {
            onChange(MAXIMIZED);
        },
        src: composerMaximizedSvg,
        describedByID,
    };

    return (
        <LayoutCards
            list={[layoutCardPopup, layoutCardMaximized]}
            className={className}
            liClassName={liClassName}
            describedByID={describedByID}
            {...rest}
        />
    );
};

export default ComposerModeCards;

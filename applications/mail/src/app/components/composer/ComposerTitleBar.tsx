import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, Tooltip, classnames, useMailSettings } from 'react-components';
import { metaKey, shiftKey, isSafari as checkIsSafari } from 'proton-shared/lib/helpers/browser';

interface ButtonProps {
    onClick: () => void;
    iconName: string;
    className?: string;
    title?: ReactNode;
    disabled?: boolean;
}

const TitleBarButton = ({ onClick, iconName, className = '', title, disabled = false }: ButtonProps) => {
    return (
        <Tooltip title={title} className="composer-title-bar-tooltip flex-item-noshrink flex">
            <button
                type="button"
                className={classnames(['composer-title-bar-button flex p0-5', className])}
                onClick={onClick}
                disabled={disabled}
                data-test-id="composer:close-composer"
            >
                <Icon className="mauto" name={iconName} />
                <span className="sr-only">{title}</span>
            </button>
        </Tooltip>
    );
};

interface Props {
    title: string;
    minimized: boolean;
    maximized: boolean;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    onClose: () => void;
}

const ComposerTitleBar = ({ title, minimized, maximized, toggleMinimized, toggleMaximized, onClose }: Props) => {
    const isSafari = checkIsSafari();

    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const handleDoubleClick = () => {
        if (minimized) {
            toggleMinimized();
            return;
        }
        toggleMaximized();
    };

    const titleMinimize =
        Shortcuts && !isSafari ? (
            <>
                {minimized ? c('Action').t`Maximize composer` : c('Action').t`Minimize composer`}
                <br />
                <kbd className="bg-global-altgrey no-border">{metaKey}</kbd> +{' '}
                <kbd className="bg-global-altgrey no-border">M</kbd>
            </>
        ) : minimized ? (
            c('Action').t`Maximize composer`
        ) : (
            c('Action').t`Minimize composer`
        );

    const titleMaximize =
        Shortcuts && !isSafari ? (
            <>
                {maximized ? c('Action').t`Contract composer` : c('Action').t`Expand composer`}
                <br />
                <kbd className="bg-global-altgrey no-border">{metaKey}</kbd> +{' '}
                <kbd className="bg-global-altgrey no-border">{shiftKey}</kbd> +{' '}
                <kbd className="bg-global-altgrey no-border">M</kbd>
            </>
        ) : maximized ? (
            c('Action').t`Contract composer`
        ) : (
            c('Action').t`Expand composer`
        );

    const titleClose = Shortcuts ? (
        <>
            {c('Action').t`Close composer`}
            <br />
            <kbd className="bg-global-altgrey no-border">Escape</kbd>
        </>
    ) : (
        c('Action').t`Close composer`
    );

    return (
        <header
            className="composer-title-bar flex flex-row flex-align-items-center flex-nowrap pl0-5 pr0-5 w100 color-global-light"
            onDoubleClick={handleDoubleClick}
        >
            <span className="flex-item-fluid p0-5 pr1 text-ellipsis">{title}</span>
            <TitleBarButton
                iconName="minimize"
                className={classnames(['no-mobile', minimized && 'rotateX-180'])}
                title={titleMinimize}
                onClick={toggleMinimized}
            />
            <TitleBarButton
                iconName={maximized ? 'contract-window' : 'expand'}
                title={titleMaximize}
                className="no-mobile"
                onClick={toggleMaximized}
            />
            <TitleBarButton iconName="close" title={titleClose} onClick={onClose} />
        </header>
    );
};

export default ComposerTitleBar;

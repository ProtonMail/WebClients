import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, Tooltip, classnames, useMailSettings } from 'react-components';
import { metaKey, shiftKey, isSafari as checkIsSafari } from 'proton-shared/lib/helpers/browser';

interface ButtonProps {
    onClick: () => void;
    className?: string;
    title?: ReactNode;
    children?: ReactNode;
    disabled?: boolean;
}

const TitleBarButton = ({ onClick, children, className = '', title, disabled = false }: ButtonProps) => {
    return (
        <Tooltip title={title}>
            <button
                type="button"
                className={classnames(['composer-title-bar-button flex p0-5', className])}
                onClick={onClick}
                disabled={disabled}
                data-test-id="composer:close-composer"
            >
                {children}
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
                className={classnames(['no-mobile', minimized && 'rotateX-180'])}
                title={titleMinimize}
                onClick={toggleMinimized}
            >
                <Icon name="minimize" alt={title} className="mauto" />
            </TitleBarButton>
            <TitleBarButton title={titleMaximize} className="no-mobile" onClick={toggleMaximized}>
                <Icon name={maximized ? 'contract-window' : 'expand'} alt={title} className="mauto" />
            </TitleBarButton>
            <TitleBarButton title={titleClose} onClick={onClose}>
                <Icon name="close" alt={title} className="mauto" />
            </TitleBarButton>
        </header>
    );
};

export default ComposerTitleBar;

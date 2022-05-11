import React, { ComponentPropsWithRef, useContext } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms';

import { classnames } from '../../helpers';
import { Button, ButtonProps } from '../button';
import { Icon } from '../icon';
import { Tooltip } from '../tooltip';
import { ModalContext } from './Modal';

import './ModalHeader.scss';

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
    /**
     * The title to render in the Modal header.
     */
    title?: string | JSX.Element;
    /**
     * A subline to render below the Title.
     * Will not render unless "title" is passed as well.
     */
    subline?: string;
    /**
     * Intended for use with icon buttons.
     * Slot for Element(s) to be rendered next to the close button.
     *
     */
    actions?: JSX.Element | [JSX.Element] | [JSX.Element, JSX.Element];
    /**
     * Props forwarded to the close Button component
     */
    closeButtonProps?: ButtonProps;
    /**
     * Is the close button displayed? defaults to true
     */
    hasClose?: boolean;
    /**
     * Optional additional title classNames
     */
    titleClassName?: string;
    /**
     * Additional content to be rendered above the scrollable section.
     */
    additionalContent?: JSX.Element;
}

const ModalHeader = ({
    title,
    subline,
    actions,
    closeButtonProps,
    titleClassName,
    additionalContent,
    hasClose = true,
    ...rest
}: ModalHeaderProps) => {
    const { id, onClose, size } = useContext(ModalContext);

    const [firstAction, secondAction] = Array.isArray(actions) ? actions : [actions];

    return (
        <div className="modal-two-header ">
            <div
                className={classnames([
                    'flex flex-nowrap flex-item-noshrink flex-align-items-start',
                    title ? 'flex-justify-space-between' : 'flex-justify-end',
                ])}
                {...rest}
            >
                {title && (
                    <div className="modal-two-header-title mt0-25">
                        <h3
                            id={id}
                            className={classnames([
                                'text-bold',
                                ['large', 'full'].includes(size) ? 'text-4xl' : 'text-2xl',
                                titleClassName,
                            ])}
                        >
                            {title}
                        </h3>
                        {subline && <div className="color-weak">{subline}</div>}
                    </div>
                )}

            <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                {actions && (
                    <>
                        {firstAction}
                        {secondAction}
                        <Vr className="my0-25" />
                    </>
                )}

                {hasClose && (
                    <Tooltip title={c('Action').t`Close`}>
                        <Button
                            className="flex-item-noshrink"
                            icon
                            shape="ghost"
                            onClick={onClose}
                            {...closeButtonProps}
                        >
                            <Icon className="modal-close-icon" name="cross-big" />
                        </Button>
                    </Tooltip>
                )}
                </div>
            </div>
            {additionalContent}
        </div>
    );
};

export default ModalHeader;

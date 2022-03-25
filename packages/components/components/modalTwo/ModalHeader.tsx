import React, { ComponentPropsWithRef, useContext } from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';
import { Icon } from '../icon';
import { Button, ButtonProps } from '../button';
import { Tooltip } from '../tooltip';
import { Vr } from '../vr';
import { ModalContext } from './Modal';
import './ModalHeader.scss';

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    /**
     * The title to render in the Modal header.
     */
    title?: string;
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
}

const ModalHeader = ({ title, subline, actions, closeButtonProps, ...rest }: ModalHeaderProps) => {
    const { id, onClose, size } = useContext(ModalContext);

    const [firstAction, secondAction] = Array.isArray(actions) ? actions : [actions];

    return (
        <div
            className={classnames([
                'modal-two-header flex flex-nowrap flex-item-noshrink flex-align-items-start',
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

                <Tooltip title={c('Action').t`Close modal`}>
                    <Button className="flex-item-noshrink" icon shape="ghost" onClick={onClose} {...closeButtonProps}>
                        <Icon className="modal-close-icon" name="xmark" />
                    </Button>
                </Tooltip>
            </div>
        </div>
    );
};

export default ModalHeader;

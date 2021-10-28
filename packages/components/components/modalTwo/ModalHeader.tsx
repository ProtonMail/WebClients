import React, { ComponentPropsWithRef, useContext } from 'react';

import { classnames } from '../../helpers';
import { Icon } from '../icon';
import { Button } from '../button';
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
     */
    actions?: JSX.Element;
    /**
     * If passed, renders a back button in the Modal's header.
     * Fires on click of said back button.
     */
    onBack?: () => void;
}

const ModalHeader = ({ title, subline, actions, onBack, ...rest }: ModalHeaderProps) => {
    const { id, onClose } = useContext(ModalContext);

    return (
        <div
            className={classnames([
                'modal-two-header flex flex-nowrap flex-item-noshrink flex-align-items-start',
                onBack && 'modal-two-header--with-back',
                onBack || title ? 'flex-justify-space-between' : 'flex-justify-end',
            ])}
            {...rest}
        >
            {onBack && (
                <div className="flex-item-noshrink">
                    <Button className="flex-item-noshrink" icon shape="ghost" onClick={onBack}>
                        <Icon className="modal-close-icon" name="arrow-left" />
                    </Button>
                </div>
            )}

            {title && (
                <div className={classnames(['mt0-5', onBack && 'text-center'])}>
                    <h3 id={id} className="text-lg text-bold">
                        {title}
                    </h3>
                    {subline && <div className="color-weak">{subline}</div>}
                </div>
            )}

            <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                {actions && (
                    <>
                        {actions} <Vr className="my0-25" />
                    </>
                )}

                <Button className="flex-item-noshrink" icon shape="ghost" onClick={onClose}>
                    <Icon className="modal-close-icon" name="xmark" />
                </Button>
            </div>
        </div>
    );
};

export default ModalHeader;

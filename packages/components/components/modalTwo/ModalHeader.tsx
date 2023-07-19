import React, { ComponentPropsWithRef, ReactElement, ReactNode, cloneElement, useContext } from 'react';

import { c } from 'ttag';

import { Button, ButtonProps, Vr } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import clsx from '@proton/utils/clsx';

import { Icon } from '../icon';
import { Tooltip } from '../tooltip';
import { ModalContext } from './Modal';

import './ModalHeader.scss';

interface ModalHeaderProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
    /**
     * The title to render in the Modal header.
     */
    title?: ReactNode;
    /**
     * A subline to render below the Title.
     * Will not render unless "title" is passed as well.
     */
    subline?: string | JSX.Element;
    /**
     * Intended for use with icon buttons.
     * Slot for Element(s) to be rendered next to the close button.
     *
     */
    actions?: JSX.Element | JSX.Element[];
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

    const actionsArray = Array.isArray(actions) ? actions : [actions];

    return (
        <div className="modal-two-header">
            <div
                className={clsx(
                    'flex flex-nowrap flex-item-noshrink flex-align-items-start',
                    title ? 'flex-justify-space-between' : 'flex-justify-end'
                )}
                {...rest}
            >
                {title && (
                    <div className="modal-two-header-title mt-1">
                        <h1
                            id={id}
                            className={clsx(
                                'text-bold',
                                ['large', 'full'].includes(size) ? 'text-4xl' : 'text-2xl',
                                titleClassName
                            )}
                        >
                            {title}
                        </h1>
                        {subline && <div className="color-weak text-break">{subline}</div>}
                    </div>
                )}

                <div className="modal-two-header-actions flex flex-item-noshrink flex-nowrap flex-align-items-stretch">
                    {actions && (
                        <>
                            {actionsArray.map((action) =>
                                cloneElement(action as ReactElement, { key: generateUID('modal-action') })
                            )}
                            <Vr className="my-1" />
                        </>
                    )}

                    {hasClose && (
                        <Tooltip title={c('Action').t`Close`}>
                            <Button
                                className="flex-item-noshrink"
                                icon
                                shape="ghost"
                                data-testid="modal:close"
                                onClick={onClose}
                                {...closeButtonProps}
                            >
                                <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
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

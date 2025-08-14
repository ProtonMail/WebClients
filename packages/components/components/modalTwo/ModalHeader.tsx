import type { ComponentPropsWithRef, ReactElement, ReactNode, SVGProps } from 'react';
import { cloneElement, useContext } from 'react';

import { c } from 'ttag';

import type { ButtonProps } from '@proton/atoms';
import { Button, Vr } from '@proton/atoms';
import { Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

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
     * Optional additional subline classNames
     */
    sublineClassName?: string;
    /**
     * Additional content to be rendered above the title.
     */
    leadingContent?: JSX.Element;
    /**
     * Additional content to be rendered above the scrollable section.
     */
    additionalContent?: JSX.Element;
}

interface ModalHeaderCloseButtonProps {
    buttonProps?: ButtonProps;
    iconProps?: Omit<SVGProps<SVGSVGElement>, 'ref' | 'name' | 'rotate'>;
}

export const ModalHeaderCloseButton = ({ buttonProps, iconProps }: ModalHeaderCloseButtonProps) => {
    const { onClose } = useContext(ModalContext);

    return (
        <Tooltip title={c('Action').t`Close`}>
            <Button shape="ghost" data-testid="modal:close" {...buttonProps} icon onClick={onClose}>
                <Icon
                    {...iconProps}
                    className={clsx('modal-close-icon', iconProps?.className)}
                    name="cross-big"
                    alt={c('Action').t`Close`}
                />
            </Button>
        </Tooltip>
    );
};

const ModalHeader = ({
    title,
    subline,
    actions,
    closeButtonProps,
    titleClassName,
    sublineClassName,
    leadingContent,
    additionalContent,
    hasClose = true,
    ...rest
}: ModalHeaderProps) => {
    const { id, size } = useContext(ModalContext);

    const actionsArray = Array.isArray(actions) ? actions : [actions];

    return (
        <div className="modal-two-header">
            <div
                className={clsx(
                    'flex flex-nowrap shrink-0 items-start',
                    title ? 'justify-space-between' : 'justify-end',
                    rest?.className
                )}
                {...rest}
            >
                {leadingContent}
                {title && (
                    <div className="modal-two-header-title mt-1">
                        <h1
                            id={id}
                            className={clsx(
                                'text-break',
                                ['large', 'full'].includes(size) ? 'text-4xl' : 'text-2xl',
                                titleClassName
                            )}
                        >
                            {title}
                        </h1>
                        {subline && <div className={clsx('color-weak text-break', sublineClassName)}>{subline}</div>}
                    </div>
                )}

                <div className={'modal-two-header-actions flex shrink-0 flex-nowrap items-stretch'}>
                    {actions && (
                        <>
                            {actionsArray.map((action) =>
                                cloneElement(action as ReactElement, { key: generateUID('modal-action') })
                            )}
                            <Vr className="my-1" />
                        </>
                    )}

                    {hasClose && (
                        <ModalHeaderCloseButton
                            buttonProps={{
                                ...closeButtonProps,
                                className: clsx('shrink-0', closeButtonProps?.className),
                            }}
                        />
                    )}
                </div>
            </div>
            {additionalContent}
        </div>
    );
};

export default ModalHeader;

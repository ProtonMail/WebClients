import { ReactNode, useState, HTMLProps } from 'react';
import { c } from 'ttag';

import { Tooltip, ButtonLike, Icon } from '@proton/components';

import { classnames, generateUID } from '../../helpers';
import { ButtonLikeProps } from '../button';

export interface Props extends HTMLProps<HTMLDivElement> {
    headerContent: ReactNode;
    openText?: string;
    closeText?: string;
    expandByDefault?: boolean;
    hideButton?: boolean;
    disableFullWidth?: boolean;
    buttonLikeProps?: Omit<ButtonLikeProps<'button'>, 'ariaExpanded' | 'ariaControls' | 'icon' | 'type'>;
}

const Collapsible = ({
    headerContent,
    openText = c('Collapsible tooltip').t`Open`,
    closeText = c('Collapsible tooltip').t`Close`,
    expandByDefault = false,
    hideButton = false,
    disableFullWidth = false,
    buttonLikeProps = {},
    children,
    ...rest
}: Props) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(expandByDefault);
    const tooltipText = isExpanded ? closeText : openText;
    const contentId = generateUID('collapsible');
    const headerId = generateUID('collapsible');

    const { onClick, className: buttonClassName, ...buttonLikePropsRest } = buttonLikeProps;

    return (
        <div {...rest}>
            <header className="flex flex-nowrap flex-align-items-center">
                <div
                    id={headerId}
                    className={classnames([!disableFullWidth && 'flex-item-fluid'])}
                    onClick={() => setIsExpanded((prevState) => !prevState)}
                >
                    {headerContent}
                </div>
                {!hideButton && (
                    <Tooltip title={tooltipText}>
                        <ButtonLike
                            shape="ghost"
                            color="weak"
                            {...buttonLikePropsRest}
                            aria-expanded={isExpanded}
                            aria-controls={contentId}
                            icon
                            type="button"
                            className={classnames([buttonClassName, 'flex flex-item-noshrink ml0-5'])}
                            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                                setIsExpanded((prevState) => !prevState);
                                onClick?.(e);
                            }}
                        >
                            <Icon name="angle-down" className="caret-like" />
                            <span className="sr-only">{tooltipText}</span>
                        </ButtonLike>
                    </Tooltip>
                )}
            </header>
            <div id={contentId} role="region" aria-labelledby={headerId} hidden={!isExpanded} aria-hidden={!isExpanded}>
                {children}
            </div>
        </div>
    );
};

export default Collapsible;

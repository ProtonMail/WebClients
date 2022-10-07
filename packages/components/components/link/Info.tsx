import { MouseEvent, ReactNode, useState } from 'react';

import { c } from 'ttag';

import { classnames, generateUID } from '../../helpers';
import Icon from '../icon/Icon';
import { Popper, PopperPlacement, usePopper, usePopperAnchor } from '../popper';
import useTooltipHandlers from '../tooltip/useTooltipHandlers';

interface Props {
    originalPlacement?: PopperPlacement;
    url?: string;
    title?: ReactNode;
    buttonClass?: string;
    buttonTabIndex?: number;
    className?: string;
    questionMark?: boolean;
    colorPrimary?: boolean;
}

const Info = ({
    originalPlacement = 'top',
    url,
    title = undefined,
    buttonClass = 'inline-flex color-inherit',
    buttonTabIndex,
    className = '',
    questionMark = false,
    colorPrimary = true,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const { open, close, isOpen } = usePopperAnchor<HTMLButtonElement>();
    const { floating, reference, position, arrow, placement } = usePopper({
        isOpen,
        originalPlacement,
    });

    const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        if (url) {
            window.open(url);
        }
    };

    const tooltipHandlers = useTooltipHandlers(open, close, isOpen);
    const safeTitle = title || '';

    return (
        <>
            <button
                tabIndex={buttonTabIndex}
                className={buttonClass}
                onClick={handleClick}
                ref={reference}
                {...tooltipHandlers}
                aria-describedby={uid}
                type="button"
                role={url ? 'link' : undefined}
            >
                <Icon
                    className={classnames(['icon-16p', colorPrimary && 'color-primary', className])}
                    name={questionMark ? 'question-circle' : 'info-circle'}
                    alt={c('Action').t`More info: ${safeTitle}`}
                    {...rest}
                />
            </button>
            {title && isOpen ? (
                <Popper
                    divRef={floating}
                    id={uid}
                    isOpen={isOpen}
                    style={{ ...position, ...arrow }}
                    className={classnames(['tooltip', `tooltip--${placement}`])}
                >
                    {title}
                </Popper>
            ) : null}
        </>
    );
};

export default Info;

import { MouseEvent, ReactNode, useState } from 'react';

import { c } from 'ttag';

import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import { classnames, generateUID } from '../../helpers';
import Icon from '../icon/Icon';
import { Popper, usePopper, usePopperAnchor } from '../popper';
import useTooltipHandlers from '../tooltip/useTooltipHandlers';

interface Props {
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
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

    const [isRTL] = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const [popperEl, setPopperEl] = useState<HTMLDivElement | null>(null);
    const { anchorRef, open, close, isOpen } = usePopperAnchor<HTMLButtonElement>();
    const { position, placement } = usePopper({
        popperEl,
        anchorEl: anchorRef?.current,
        isOpen,
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
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
                ref={anchorRef}
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
                    divRef={setPopperEl}
                    id={uid}
                    isOpen={isOpen}
                    style={position}
                    className={classnames(['tooltip', `tooltip--${placement}`])}
                >
                    {title}
                </Popper>
            ) : null}
        </>
    );
};

export default Info;

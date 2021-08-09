import { useState } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { generateUID, classnames } from '../../helpers';
import Icon from '../icon/Icon';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';
import useTooltipHandlers from '../tooltip/useTooltipHandlers';

interface Props {
    originalPlacement?: 'top' | 'bottom' | 'left' | 'right';
    url?: string;
    title?: React.ReactNode;
    buttonClass?: string;
    buttonTabIndex?: number;
    className?: string;
    questionMark?: boolean;
}
const Info = ({
    url,
    title = undefined,
    originalPlacement = 'top',
    buttonClass = 'inline-flex color-inherit',
    buttonTabIndex,
    className = '',
    questionMark = false,
    ...rest
}: Props) => {
    const [uid] = useState(generateUID('tooltip'));

    const { isRTL } = useRightToLeft();
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

    const handleClick = (event: React.MouseEvent) => {
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
                    className={classnames(['icon-16p color-primary', className])}
                    name={questionMark ? 'circle-question' : 'circle-info'}
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

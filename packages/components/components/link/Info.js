import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID, classnames } from '../../helpers/component';
import Icon from '../icon/Icon';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';

const Info = ({
    url,
    title = undefined,
    originalPlacement = 'top',
    scrollContainerClass = 'main',
    buttonClass = 'inline-flex color-currentColor',
    ...rest
}) => {
    const [uid] = useState(generateUID('tooltip'));

    const { isRTL } = useRightToLeft();
    const rtlAdjustedPlacement = originalPlacement.includes('right')
        ? originalPlacement.replace('right', 'left')
        : originalPlacement.replace('left', 'right');

    const popperRef = useRef();
    const { anchorRef, open, close, isOpen } = usePopperAnchor();
    const { position, placement } = usePopper(popperRef, anchorRef, isOpen, {
        originalPlacement: isRTL ? rtlAdjustedPlacement : originalPlacement,
        scrollContainerClass
    });

    const handleClick = (event) => {
        event.preventDefault();
        url && window.open(url);
    };

    return (
        <>
            <button
                tabIndex="-1"
                className={buttonClass}
                onClick={handleClick}
                ref={anchorRef}
                onMouseEnter={open}
                onMouseLeave={close}
                onFocus={open}
                onBlur={close}
                aria-describedby={uid}
                type="button"
            >
                <Icon className="icon-16p color-primary" name="info" {...rest} />
            </button>
            {title ? (
                <Popper
                    ref={popperRef}
                    id={uid}
                    isOpen={isOpen}
                    position={position}
                    className={classnames(['tooltip', `tooltip--${placement}`])}
                >
                    {title}
                </Popper>
            ) : null}
        </>
    );
};

Info.propTypes = {
    originalPlacement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    url: PropTypes.string,
    title: PropTypes.node,
    scrollContainerClass: PropTypes.string,
    buttonClass: PropTypes.string
};

export default Info;

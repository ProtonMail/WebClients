import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID, classnames } from '../../helpers/component';
import Icon from '../icon/Icon';
import { usePopper, Popper, usePopperAnchor } from '../popper';
import useRightToLeft from '../../containers/rightToLeft/useRightToLeft';

const Info = ({ url, title, originalPlacement = 'top', scrollContainerClass = 'main', ...rest }) => {
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

    const handleClick = () => {
        url && window.open(url);
    };

    return (
        <>
            <button
                className="inline-flex"
                onClick={handleClick}
                ref={anchorRef}
                onMouseEnter={open}
                onMouseLeave={close}
                onFocus={open}
                onBlur={close}
                aria-describedby={uid}
                type="button"
            >
                <Icon className="icon-16p fill-primary" name="info" {...rest} />
            </button>
            <Popper
                ref={popperRef}
                id={uid}
                isOpen={isOpen}
                position={position}
                className={classnames(['tooltip', `tooltip--${placement}`])}
            >
                {title}
            </Popper>
        </>
    );
};

Info.propTypes = {
    originalPlacement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    url: PropTypes.string,
    title: PropTypes.node,
    scrollContainerClass: PropTypes.string
};

export default Info;

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

import { useMainArea } from '../../hooks/useMainArea';

const SettingsTitle = ({ children }) => {
    const mainAreaRef = useMainArea();
    const [topClass, setClass] = useState('sticky-title--onTop');

    useEffect(() => {
        if (!mainAreaRef.current) {
            return;
        }

        const el = mainAreaRef.current;

        const onScroll = () => {
            setClass(el.scrollTop ? '' : 'sticky-title--onTop');
        };

        onScroll();

        el.addEventListener('scroll', onScroll);
        return () => {
            el.removeEventListener('scroll', onScroll);
        };
    }, [mainAreaRef.current]);

    return <h1 className={classnames(['sticky-title', topClass])}>{children}</h1>;
};

SettingsTitle.propTypes = {
    children: PropTypes.node.isRequired,
    mainRef: PropTypes.object
};

export default SettingsTitle;

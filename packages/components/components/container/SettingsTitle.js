import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { classnames } from 'react-components';

import { useMainArea } from '../../hooks/useMainArea';

const SettingsTitle = ({ children }) => {
    const mainAreaRef = useMainArea();
    const [topClass, setClass] = useState('');

    const onScroll = () => {
        setClass(mainAreaRef.current.scrollTop ? '' : 'sticky-title--onTop');
    };

    useEffect(() => {
        mainAreaRef.current.addEventListener('scroll', onScroll);
        return () => {
            mainAreaRef.current.removeEventListener('scroll', onScroll);
        };
    }, []);

    return <h1 className={classnames(['sticky-title', topClass])}>{children}</h1>;
};

SettingsTitle.propTypes = {
    children: PropTypes.node.isRequired,
    mainRef: PropTypes.object
};

export default SettingsTitle;

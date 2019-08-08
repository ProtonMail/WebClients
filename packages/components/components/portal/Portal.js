import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

const Portal = ({ children }) => {
    const [target, setTarget] = useState(null);
    useEffect(() => {
        setTarget(document.body);
    }, []);
    return target ? ReactDOM.createPortal(children, target) : null;
};

Portal.propTypes = {
    children: PropTypes.node.isRequired
};

export default Portal;

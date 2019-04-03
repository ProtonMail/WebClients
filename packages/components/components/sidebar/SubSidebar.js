import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';

const SubSidebar = ({ list, children }) => {
    const clean = (h = '') => h.replace(/#/g, '');
    const [hash, setHash] = useState(clean(location.hash));
    const onHashChange = () => setHash(clean(location.hash));

    useEffect(() => {
        window.addEventListener('hashchange', onHashChange);
        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    }, []);

    return (
        <div className="subnav notablet nomobile bg-global-light noprint">
            <div className="subnav-inner">
                <p className="uppercase smaller">{c('Title').t`Jump to`}</p>
                <ul className="unstyled subnav-list">
                    {list.map(({ id, text }) => {
                        return (
                            <li key={id} className="mb0-5">
                                <a href={`#${id}`} aria-current={hash === id}>
                                    {text}
                                </a>
                            </li>
                        );
                    })}
                </ul>
                <div>{children}</div>
            </div>
        </div>
    );
};

SubSidebar.propTypes = {
    list: PropTypes.array.isRequired,
    children: PropTypes.node
};

SubSidebar.defaultProps = {
    list: []
};

export default SubSidebar;

import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';

const SubSidebar = ({ list = [], children }) => {
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
                <p className="uppercase smaller">{c('Title').t`Navigation`}</p>
                <ul className="unstyled subnav-list">
                    {list.map(({ id = '', text }) => {
                        const isCurrent = hash === id;
                        return (
                            <li key={id} className="mb0-5">
                                <a
                                    href={`${location.pathname}#${id}`}
                                    className="subnav-link"
                                    disabled={isCurrent}
                                    aria-current={isCurrent}
                                >
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
    list: PropTypes.array,
    children: PropTypes.node
};

export default SubSidebar;

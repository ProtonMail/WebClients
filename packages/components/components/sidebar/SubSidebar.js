import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const SubSidebar = ({ list = [], children, activeSection }) => {
    return (
        <div className="subnav notablet nomobile bg-global-light noprint">
            <div className="subnav-inner">
                <p className="uppercase smaller">{c('Title').t`Navigation`}</p>
                <ul className="unstyled subnav-list">
                    {list.map(({ id = '', text }) => {
                        const isCurrent = activeSection === id;
                        return (
                            <li key={id} className="mb0-5">
                                <Link
                                    className="subnav-link"
                                    data-target-id={id}
                                    to={{ hash: id }}
                                    aria-current={isCurrent}
                                >
                                    {text}
                                </Link>
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
    children: PropTypes.node,
    activeSection: PropTypes.string
};

export default SubSidebar;

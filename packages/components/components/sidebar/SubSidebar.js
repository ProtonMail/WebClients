import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';

const SubSidebar = ({ list = [], children, activeSection }) => {
    const handleClick = (event) => {
        const el = document.querySelector(`#${event.currentTarget.dataset.targetId}`);
        // If the element was found, no need to set the hash since the intersection observer will do it
        if (el) {
            event.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="subnav notablet nomobile bg-global-light noprint">
            <div className="subnav-inner">
                <p className="uppercase smaller">{c('Title').t`Navigation`}</p>
                <ul className="unstyled subnav-list">
                    {list.map(({ id = '', text }) => {
                        const isCurrent = activeSection === id;
                        return (
                            <li key={id} className="mb0-5">
                                <a
                                    className="subnav-link"
                                    data-target-id={id}
                                    onClick={handleClick}
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
    children: PropTypes.node,
    activeSection: PropTypes.string
};

export default SubSidebar;

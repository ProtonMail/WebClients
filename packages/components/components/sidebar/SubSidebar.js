import React, { useMemo, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

const SubSidebar = ({ list = [], children, location }) => {
    const hash = useMemo(() => location.hash.slice(1), [location.hash]);

    const handleClick = (event) => {
        const el = document.querySelector(`#${event.currentTarget.dataset.targetId}`);
        // If the element was found, no need to set the hash since the intersection observer will do it
        if (el) {
            event.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        if (!location.hash) {
            return;
        }
        /**
         * Purpose is to scroll into view on first page load.
         * It relies on the fact that when clicking a link, no hash is set.
         * This has some caveats because if sections are dynamic they can grow / shrink
         * and thus go to the wrong section.
         */
        const el = document.querySelector(location.hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
                                    data-target-id={id}
                                    onClick={handleClick}
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
    children: PropTypes.node,
    location: PropTypes.object.isRequired
};

export default withRouter(SubSidebar);

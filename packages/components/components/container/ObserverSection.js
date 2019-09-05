import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const ObserverSection = ({ id, className = 'container-section-sticky-section', observer, children }) => {
    const ref = useRef();

    useEffect(() => {
        if (!observer || !ref.current) {
            return;
        }
        observer.observe(ref.current);
        return () => {
            observer.unobserve(ref.current);
        };
    }, [observer, ref.current]);

    return (
        <>
            <div className="relative">
                <div id={id} className="header-height-anchor" />
            </div>
            <section className={className} ref={ref} data-target-id={id}>
                {children}
            </section>
        </>
    );
};

ObserverSection.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string.isRequired,
    observer: PropTypes.object,
    children: PropTypes.node.isRequired
};

export default ObserverSection;

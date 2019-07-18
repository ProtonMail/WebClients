import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import 'intersection-observer';
import { debounce } from 'proton-shared/lib/helpers/function';

import { buildThresholds, indexOfMax } from '../../helpers/intersectionObserver';

const ObserverSection = ({
    id,
    className,
    rootElement,
    rootMargin,
    granularity,
    index,
    setIntersectionData,
    wait,
    children
}) => {
    const ref = useRef();
    const unmounted = useRef();

    useEffect(() => {
        return () => (unmounted.current = true);
    }, []);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const handleIntersect = (entries) => {
            // Needed due to the debounce
            if (unmounted.current) {
                return;
            }
            entries.forEach((entry) => {
                setIntersectionData(({ intersectionRatios, listOfIds }) => {
                    const newIntersectionRatios = intersectionRatios.slice();
                    newIntersectionRatios[index] = Math.min(entry.intersectionRatio, 1); // manual fix for bug IntersectionObserverEntry.intersectionRatio > 1
                    const idToDisplay = listOfIds[indexOfMax(newIntersectionRatios)];
                    return {
                        intersectionRatios: newIntersectionRatios,
                        hashToDisplay: `#${idToDisplay}`,
                        listOfIds
                    };
                });
            });
        };

        const options = {
            root: rootElement,
            rootMargin,
            threshold: buildThresholds(granularity)
        };

        const observer = new IntersectionObserver(debounce(handleIntersect, wait), options);
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
        };
    }, [ref.current]);

    return (
        <section id={id} className={className} ref={ref}>
            {children}
        </section>
    );
};

ObserverSection.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string.isRequired,
    rootElement: PropTypes.node,
    rootMargin: PropTypes.string,
    granularity: PropTypes.number,
    index: PropTypes.number.isRequired,
    setIntersectionData: PropTypes.func.isRequired,
    wait: PropTypes.number,
    children: PropTypes.node.isRequired
};

ObserverSection.defaultProps = {
    className: 'mb2',
    rootElement: null,
    rootMargin: '0px',
    granularity: 20,
    wait: 500
};

export default ObserverSection;

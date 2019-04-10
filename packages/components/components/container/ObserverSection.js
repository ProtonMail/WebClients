import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import 'intersection-observer';
import { buildThresholds, indexOfMax } from 'react-components';
import { debounce } from 'proton-shared/lib/helpers/function';

const ObserverSection = ({ id, rootElement, rootMargin, granularity, index, setIntersectionData, wait, children }) => {
    const handleIntersect = (entries) => {
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

    useEffect(() => {
        const options = {
            root: rootElement,
            rootMargin,
            threshold: buildThresholds(granularity)
        };
        const target = document.getElementById(id);

        const observer = new IntersectionObserver(debounce(handleIntersect, wait), options);
        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, []);

    return <section id={id}>{children}</section>;
};

ObserverSection.propTypes = {
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
    rootElement: null,
    rootMargin: '0px',
    granularity: 20,
    wait: 500
};

export default ObserverSection;

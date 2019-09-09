import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import 'intersection-observer';

import ObserverSection from './ObserverSection';

const ObserverSections = ({ children, setActiveSection }) => {
    React.Children.forEach(children, (child) => {
        if (!child.props.id) throw new Error('All sections to be observed need an id');
    });
    const [observer, setObserver] = useState();

    useEffect(() => {
        if (!setActiveSection) {
            return;
        }

        const map = {};
        const keys = [];

        const handleIntersect = (elements) => {
            elements.forEach((element) => {
                const { target, intersectionRatio } = element;
                const id = target.dataset.targetId;
                if (!map[id]) {
                    keys.push(id);
                }
                map[id] = intersectionRatio;
            });

            const { id } = keys.reduce(
                (cur, id) => {
                    const otherValue = map[id];
                    if (otherValue > cur.value) {
                        return { value: otherValue, id };
                    }
                    return cur;
                },
                { value: map[keys[0]], id: keys[0] }
            );

            setActiveSection(id);
        };

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: [0.5, 0.99]
            /*
                A 0.5 threshold takes care of observing changes in big sections, while the 0.99 takes care of small sections.
                Using 0.99 instead of 1 should help in case intersectionRatio doesn't fully reach 1, which has been observed to happen
            */
        };

        const observer = new IntersectionObserver(handleIntersect, options);
        setObserver(observer);
        return () => {
            observer.disconnect();
        };
    }, []);

    return React.Children.map(children, (child) => {
        return (
            <ObserverSection id={child.props.id} observer={observer}>
                {child}
            </ObserverSection>
        );
    });
};

ObserverSections.propTypes = {
    children: PropTypes.node.isRequired,
    setActiveSection: PropTypes.func
};

export default ObserverSections;

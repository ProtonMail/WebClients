import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import 'intersection-observer';

import ObserverSection from './ObserverSection';

const ObserverSections = ({ children, history, location }) => {
    React.Children.forEach(children, (child) => {
        if (!child.props.id) throw new Error('All sections to be observed need an id');
    });
    const [targetID, setNewTarget] = useState();
    const [observer, setObserver] = useState();

    useEffect(() => {
        const newHash = `#${targetID}`;
        if (!targetID || location.hash === newHash) {
            return;
        }
        history.replace(newHash);
    }, [targetID]);

    useEffect(() => {
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

            setNewTarget(id);
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
    history: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default withRouter(ObserverSections);

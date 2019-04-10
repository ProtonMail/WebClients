import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ObserverSection } from 'react-components';
import useDebounceInput from '../input/useDebounceInput';

const ObserverSections = ({ granularity, wait, children }) => {
    // throw error if any child does not have id
    React.Children.forEach(children, (child) => {
        if (!child.props.id) throw new Error('All sections to be observed need an id');
    });

    const [intersectionData, setIntersectionData] = useState({
        intersectionRatios: Array(React.Children.count(children))
            .fill(1)
            .fill(0, 1),
        listOfIds: React.Children.map(children, (child) => child.props.id),
        hashToDisplay: ''
    });
    const debouncedHashToDisplay = useDebounceInput(intersectionData.hashToDisplay, wait);

    useEffect(() => {
        const currentURL = document.URL;
        const newURL = /#/.test(currentURL)
            ? currentURL.replace(/#(.*)/, debouncedHashToDisplay)
            : currentURL + debouncedHashToDisplay;
        history.replaceState('', '', newURL);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, [debouncedHashToDisplay]);

    return React.Children.map(children, (child, index) => {
        return (
            <ObserverSection
                id={child.props.id}
                granularity={granularity}
                index={index}
                setIntersectionData={setIntersectionData}
                wait={wait}
            >
                {child}
            </ObserverSection>
        );
    });
};

ObserverSections.propTypes = {
    children: PropTypes.node.isRequired,
    granularity: PropTypes.number,
    wait: PropTypes.number
};

ObserverSections.defaultProps = {
    granularity: 20,
    wait: 500
};

export default ObserverSections;

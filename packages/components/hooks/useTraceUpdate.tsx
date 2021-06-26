import { useRef, useEffect, MutableRefObject } from 'react';

const traceChanges = (componentName: string, typeName: string, current: any, previousRef: MutableRefObject<any>) => {
    const changedProps = Object.entries(current).reduce<any>((acc, [key, value]) => {
        if (previousRef.current[key] !== value) {
            acc[key] = [previousRef.current[key], value];
        }
        return acc;
    }, {});
    if (Object.keys(changedProps).length > 0) {
        // eslint-disable-next-line no-console
        console.log(componentName, typeName, 'Changes:', changedProps);
    }
    previousRef.current = current;
};

/**
 * Debugging hook helper to trace rendering and changes of component
 */
const useTraceUpdate = (componentName: string, props: any = {}, states: any = {}) => {
    const renderCounter = useRef(0);
    const previousProps = useRef(props);
    const previousStates = useRef(states);

    useEffect(() => {
        // eslint-disable-next-line no-console
        console.log('Render', componentName, renderCounter.current++);
        traceChanges(componentName, 'Props', props, previousProps);
        traceChanges(componentName, 'States', states, previousStates);
    });
};

export default useTraceUpdate;

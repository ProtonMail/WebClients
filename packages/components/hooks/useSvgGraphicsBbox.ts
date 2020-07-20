import { RefObject, useLayoutEffect, useState } from 'react';

// These defaults do not matter
const DEFAULT = {
    y: 0,
    x: 0,
    width: 100,
    height: 100,
};
const useSvgGraphicsBbox = (ref: RefObject<SVGGraphicsElement>, deps: any[] = []) => {
    const [bbox, setBbox] = useState(DEFAULT);

    useLayoutEffect(() => {
        if (!ref.current) {
            setBbox(DEFAULT);
            return;
        }
        setBbox(ref.current.getBBox());
    }, [ref.current, ...deps]);

    return bbox;
};

export default useSvgGraphicsBbox;

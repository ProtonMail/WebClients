import type { ReactNode, Ref } from 'react';
import { isValidElement } from 'react';

import { isReact19 } from './isReact19';

/**
 * The ref given to an element. React 19 passes it in `props.ref` and warns when `element.ref` is read; React 18 only
 * has `element.ref`. Replace it with `element.props.ref` once on React 19.
 */
export const getElementRef = <T>(element: ReactNode): Ref<T> | undefined => {
    if (!isValidElement(element)) {
        return undefined;
    }
    const { ref } = (isReact19 ? element.props : element) as { ref?: Ref<T> | null };
    return ref ?? undefined;
};

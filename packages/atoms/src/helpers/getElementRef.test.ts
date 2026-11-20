import { createElement, createRef } from 'react';

import { getElementRef } from './getElementRef';

describe('getElementRef', () => {
    it('returns the ref given to the element', () => {
        const ref = createRef<HTMLDivElement>();
        expect(getElementRef(createElement('div', { ref }))).toBe(ref);
    });

    it('returns undefined without a ref or an element', () => {
        expect(getElementRef(createElement('div'))).toBeUndefined();
        expect(getElementRef('text')).toBeUndefined();
        expect(getElementRef(null)).toBeUndefined();
    });
});

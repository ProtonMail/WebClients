import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createElement } from 'react';

import { renderHook } from '@testing-library/react-hooks';

import rightToLeftContext from './rightToLeftContext';
import useRightToLeft from './useRightToLeft';

const withProvider = (value: [boolean, Dispatch<SetStateAction<boolean>>]) => {
    return function Wrapper({ children }: { children?: ReactNode }) {
        return createElement(rightToLeftContext.Provider, { value }, children);
    };
};

describe('useRightToLeft', () => {
    it('should return the state provided by the closest provider', () => {
        const setRightToLeft = jest.fn();

        const hook = renderHook(() => useRightToLeft(), { wrapper: withProvider([true, setRightToLeft]) });

        expect(hook.result.current[0]).toBe(true);
        expect(hook.result.current[1]).toBe(setRightToLeft);
    });

    it('should not be right to left when rendered without a provider', () => {
        const hook = renderHook(() => useRightToLeft());

        expect(hook.result.current[0]).toBeFalsy();
    });
});

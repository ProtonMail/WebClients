import { useId } from 'react';

import { renderHook } from '@testing-library/react';

import { useSvgId } from './useSvgId';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useId: jest.fn(),
}));

const mockedUseId = jest.mocked(useId);

describe('useSvgId', () => {
    beforeEach(() => {
        mockedUseId.mockReturnValue(':r1:');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('strips colons from the React id', () => {
        const { result } = renderHook(() => useSvgId());

        expect(result.current).toBe('r1');
    });

    it('prepends the prefix when provided', () => {
        const { result } = renderHook(() => useSvgId('circle-loader'));

        expect(result.current).toBe('circle-loader-r1');
    });

    it('keeps the same id between re-renders', () => {
        const { result, rerender } = renderHook(({ prefix }) => useSvgId(prefix), {
            initialProps: { prefix: 'circle-loader' },
        });

        const firstId = result.current;

        rerender({ prefix: 'circle-loader' });

        expect(result.current).toBe(firstId);
    });
});

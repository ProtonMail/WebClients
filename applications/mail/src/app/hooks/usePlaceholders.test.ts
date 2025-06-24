import { renderHook } from '@testing-library/react-hooks';

import useMailModel from './useMailModel';
import { usePlaceholders } from './usePlaceholders';

jest.mock('./useMailModel');
const mockedUseMailModel = useMailModel as jest.Mock;

describe('usePlaceholders', () => {
    beforeEach(() => {
        mockedUseMailModel.mockReturnValue({
            PageSize: 50,
        });
    });

    it('should return the correct number of placeholders', () => {
        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [{ ID: '1' }],
                loading: false,
                expectedLength: 10,
            })
        );

        expect(result.current.length).toBe(1);
    });

    it('should return the correct number of placeholders when loading is true', () => {
        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [],
                loading: true,
                expectedLength: 10,
            })
        );

        expect(result.current.length).toBe(10);
    });

    it('should return the correct number of placeholders when unsafeLength is true', () => {
        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [],
                loading: true,
                expectedLength: 1000,
                unsafeLength: true,
            })
        );

        expect(result.current.length).toBe(1000);
    });

    it('should return the correct number of placeholders when unsafeLength is false', () => {
        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [],
                loading: true,
                expectedLength: 1000,
            })
        );

        expect(result.current.length).toBe(50);
    });

    it('should return the correct number of placeholders if the page size is 100', () => {
        mockedUseMailModel.mockReturnValue({
            PageSize: 100,
        });

        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [],
                loading: true,
                expectedLength: 1000,
            })
        );

        expect(result.current.length).toBe(100);
    });

    it('should mix input elements and placeholders', () => {
        const { result } = renderHook(() =>
            usePlaceholders({
                inputElements: [{ ID: '1' }, { ID: '2' }],
                loading: true,
                expectedLength: 10,
            })
        );

        expect(result.current.length).toBe(10);
        expect(result.current[0].ID).toBe('1');
        expect(result.current[1].ID).toBe('2');
        expect(result.current[2].ID).toBe('placeholder-0');
    });
});

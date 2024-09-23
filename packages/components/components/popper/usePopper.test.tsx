import { useState } from 'react';

import type { Middleware } from '@floating-ui/dom';
import { shift as mockedShift } from '@floating-ui/dom';
import { act, render, screen } from '@testing-library/react';

import type { PopperPlacement } from '@proton/components/components/popper/interface';
import { wait } from '@proton/shared/lib/helpers/promise';

import usePopper from './usePopper';

jest.mock('@floating-ui/dom', () => {
    const originalModule = jest.requireActual('@floating-ui/dom');

    // Mock the default export and named export 'foo'
    return {
        __esModule: true,
        ...originalModule,
        shift: jest.fn(originalModule.shift),
    };
});

describe('usePopper', () => {
    Object.defineProperties(window.HTMLElement.prototype, {
        // @ts-ignore
        getBoundingClientRect: {
            value: function () {
                return {
                    width: parseFloat(this.style.width) || 0,
                    height: parseFloat(this.style.height) || 0,
                    top: parseFloat(this.style.top) || 0,
                    left: parseFloat(this.style.left) || 0,
                };
            },
        },
        clientHeight: {
            get: function () {
                return 100;
            },
        },
        clientWidth: {
            get: function () {
                return 100;
            },
        },
    });

    const Test = ({
        isOpen,
        originalPlacement,
        anchor,
    }: {
        isOpen: boolean;
        originalPlacement: PopperPlacement;
        anchor?: { top: number; left: number };
    }) => {
        const [ref, setRef] = useState<HTMLDivElement | null>(null);
        const { floating, position, arrow, placement } = usePopper({
            isOpen,
            originalPlacement,
            offset: 0,
            reference: anchor
                ? {
                      mode: 'position',
                      value: anchor,
                      anchor: ref,
                  }
                : {
                      mode: 'element',
                      value: ref,
                  },
        });
        return (
            <div>
                <div
                    ref={setRef}
                    data-testid="reference"
                    style={{ top: '10px', left: '10px', width: '10px', height: '10px' }}
                >
                    hello world
                </div>
                <div
                    ref={floating}
                    data-testid="floating"
                    data-placement={placement}
                    style={{ ...position, ...arrow, width: '1px', height: '1px' }}
                >
                    floating
                </div>
            </div>
        );
    };

    it('should return a hidden placement when not open', async () => {
        render(<Test isOpen={false} originalPlacement="top-start" />);
        await act(async () => {});
        expect(screen.getByTestId('floating').dataset.placement).toBe('hidden');
    });

    it('should render a floating element when open', async () => {
        render(<Test isOpen={true} originalPlacement="top-start" />);
        await act(async () => {});
        expect(screen.getByTestId('floating').dataset.placement).toBe('top-start');
        // @ts-ignore
        expect(screen.getByTestId('floating').style._values).toEqual({
            top: '10px',
            left: '10px',
            width: '1px',
            height: '1px',
            '--arrow-offset': '0',
        });
    });

    it('should render without race conditions', async () => {
        const { rerender } = render(<Test isOpen={true} originalPlacement="top-start" />);
        const shift = mockedShift as jest.Mock<Middleware>;
        const original = shift();
        const mock: Middleware = {
            name: 'shift',
            fn: async (...args) => {
                await wait(1);
                return original.fn(...args);
            },
        };
        shift.mockReturnValue(mock);
        rerender(<Test isOpen={true} originalPlacement="top-start" />);
        shift.mockRestore();
        rerender(<Test isOpen={true} originalPlacement="top-start" anchor={{ top: 2, left: 3 }} />);
        await act(async () => {});
        // @ts-ignore
        expect(screen.getByTestId('floating').style._values).toEqual({
            top: '2px',
            left: '3px',
            width: '1px',
            height: '1px',
            '--arrow-offset': '0',
        });
    });

    it('should render a floating element in an anchor element and in an anchor position', async () => {
        const { rerender } = render(<Test isOpen={true} originalPlacement="top-start" />);
        await act(async () => {});
        // @ts-ignore
        expect(screen.getByTestId('floating').style._values).toEqual({
            top: '10px',
            left: '10px',
            width: '1px',
            height: '1px',
            '--arrow-offset': '0',
        });
        rerender(<Test isOpen={true} originalPlacement="top-start" anchor={{ top: 1, left: 2 }} />);
        await act(async () => {});
        // @ts-ignore
        expect(screen.getByTestId('floating').style._values).toEqual({
            top: '1px',
            left: '2px',
            width: '1px',
            height: '1px',
            '--arrow-offset': '0',
        });
    });
});

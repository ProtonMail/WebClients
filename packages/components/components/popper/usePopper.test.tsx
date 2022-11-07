import { act, render, screen } from '@testing-library/react';

import { PopperPlacement } from '@proton/components/components';

import usePopper from './usePopper';

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
    const Test = ({ isOpen, originalPlacement }: { isOpen: boolean; originalPlacement: PopperPlacement }) => {
        const { floating, reference, position, arrow, placement } = usePopper({
            isOpen,
            originalPlacement,
            offset: 0,
        });
        return (
            <div>
                <div
                    ref={reference}
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
});

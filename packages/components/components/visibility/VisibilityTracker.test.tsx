import React, { useRef } from 'react';

import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';

import { VisibilityTracker } from './VisibilityTracker';
import type { VisibilityThreshold, VisibilityTrackerOptions } from './types';
import { useVisibilityTracker } from './useVisibilityTracker';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------

type IOCallback = (entries: Partial<IntersectionObserverEntry>[], observer: IntersectionObserver) => void;

interface MockObserverInstance {
    callback: IOCallback;
    options: IntersectionObserverInit | undefined;
    targets: Set<Element>;
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
    trigger: (entries: Partial<IntersectionObserverEntry>[]) => void;
}

let observerInstances: MockObserverInstance[] = [];

function createMockIntersectionObserver() {
    observerInstances = [];

    const MockIO = jest.fn().mockImplementation((callback: IOCallback, options?: IntersectionObserverInit) => {
        const instance: MockObserverInstance = {
            callback,
            options,
            targets: new Set<Element>(),
            observe: jest.fn((el: Element) => instance.targets.add(el)),
            unobserve: jest.fn((el: Element) => instance.targets.delete(el)),
            disconnect: jest.fn(() => instance.targets.clear()),
            trigger(entries) {
                callback(
                    entries.map((e) => ({
                        isIntersecting: false,
                        target: [...instance.targets][0],
                        ...e,
                    })),
                    instance as unknown as IntersectionObserver
                );
            },
        };
        observerInstances.push(instance);
        return instance;
    });

    Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        configurable: true,
        value: MockIO,
    });

    return MockIO;
}

function latestObserver(): MockObserverInstance {
    return observerInstances[observerInstances.length - 1];
}

function HookWrapper({
    targetRef,
    options,
}: {
    targetRef: React.RefObject<HTMLDivElement>;
    options: VisibilityTrackerOptions;
}) {
    useVisibilityTracker(targetRef, options);
    return <div ref={targetRef} data-testid="target" />;
}

describe('VisibilityTracker', () => {
    beforeEach(() => {
        createMockIntersectionObserver();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ===========================================================================
    // 1. Component rendering
    // ===========================================================================

    describe('rendering', () => {
        it('renders a div wrapper by default', () => {
            render(
                <VisibilityTracker onEnter={jest.fn()}>
                    <span data-testid="child">hello</span>
                </VisibilityTracker>
            );
            const child = screen.getByTestId('child');
            expect(child.parentElement?.tagName).toBe('DIV');
        });

        it('renders children correctly', () => {
            render(
                <VisibilityTracker>
                    <p data-testid="para">content</p>
                </VisibilityTracker>
            );
            expect(screen.getByTestId('para')).toBeInTheDocument();
        });

        it('renders the element specified by the `as` prop', () => {
            render(
                <VisibilityTracker as="section" data-testid="wrapper">
                    <span>child</span>
                </VisibilityTracker>
            );
            expect(screen.getByTestId('wrapper').tagName).toBe('SECTION');
        });

        it('forwards extra props (className, style, data-*) to the wrapper element', () => {
            render(
                <VisibilityTracker
                    className="my-class"
                    style={{ color: 'rgb(255,0,0)' }}
                    data-testid="wrapper"
                    data-custom="yes"
                >
                    child
                </VisibilityTracker>
            );
            const el = screen.getByTestId('wrapper');
            expect(el).toHaveClass('my-class');
            expect(el).toHaveStyle({ color: 'rgb(255,0,0)' });
            expect(el).toHaveAttribute('data-custom', 'yes');
        });

        it('renders multiple children', () => {
            render(
                <VisibilityTracker>
                    <span data-testid="a">A</span>
                    <span data-testid="b">B</span>
                </VisibilityTracker>
            );
            expect(screen.getByTestId('a')).toBeInTheDocument();
            expect(screen.getByTestId('b')).toBeInTheDocument();
        });
    });

    // ===========================================================================
    // 2. IntersectionObserver lifecycle
    // ===========================================================================

    describe('observer lifecycle', () => {
        it('creates an IntersectionObserver on mount', () => {
            render(<VisibilityTracker>child</VisibilityTracker>);
            expect(window.IntersectionObserver).toHaveBeenCalledTimes(1);
        });

        it('calls observe on the wrapper element', () => {
            render(<VisibilityTracker data-testid="wrapper">child</VisibilityTracker>);
            const obs = latestObserver();
            expect(obs.observe).toHaveBeenCalledTimes(1);
            expect(obs.targets.size).toBe(1);
        });

        it('disconnects the observer on unmount', () => {
            const { unmount } = render(<VisibilityTracker>child</VisibilityTracker>);
            const obs = latestObserver();
            unmount();
            expect(obs.disconnect).toHaveBeenCalledTimes(1);
        });

        it('re-creates the observer when `threshold` changes', () => {
            const { rerender } = render(<VisibilityTracker threshold="any">child</VisibilityTracker>);
            expect(observerInstances).toHaveLength(1);

            rerender(<VisibilityTracker threshold="full">child</VisibilityTracker>);
            expect(observerInstances).toHaveLength(2);
        });

        it('re-creates the observer when `marginAroundTarget` changes', () => {
            const { rerender } = render(<VisibilityTracker marginAroundTarget="0px">child</VisibilityTracker>);
            rerender(<VisibilityTracker marginAroundTarget="100px">child</VisibilityTracker>);
            expect(observerInstances).toHaveLength(2);
        });

        it('re-creates the observer when `once` changes', () => {
            const { rerender } = render(<VisibilityTracker once={true}>child</VisibilityTracker>);
            rerender(<VisibilityTracker once={false}>child</VisibilityTracker>);
            expect(observerInstances).toHaveLength(2);
        });

        it('does NOT re-create the observer when only callbacks change', () => {
            const { rerender } = render(<VisibilityTracker onEnter={jest.fn()}>child</VisibilityTracker>);
            rerender(<VisibilityTracker onEnter={jest.fn()}>child</VisibilityTracker>);
            expect(observerInstances).toHaveLength(1);
        });
    });

    // ===========================================================================
    // 3. Threshold
    // ===========================================================================

    describe('threshold mapping', () => {
        const cases: [VisibilityThreshold, number][] = [
            ['any', 0],
            ['half', 0.5],
            ['full', 1],
        ];

        it.each(cases)('passes numeric threshold %f to IntersectionObserver for "%s"', (label, numeric) => {
            render(<VisibilityTracker threshold={label}>child</VisibilityTracker>);
            expect(latestObserver().options?.threshold).toBe(numeric);
        });

        it('defaults to "half" (0.5) when no threshold is provided', () => {
            render(<VisibilityTracker>child</VisibilityTracker>);
            expect(latestObserver().options?.threshold).toBe(0.5);
        });
    });

    // ===========================================================================
    // 4. marginAroundTarget
    // ===========================================================================

    describe('marginAroundTarget', () => {
        it('passes marginAroundTarget to IntersectionObserver as rootMargin', () => {
            render(<VisibilityTracker marginAroundTarget="200px 0px">child</VisibilityTracker>);
            expect(latestObserver().options?.rootMargin).toBe('200px 0px');
        });

        it('observer rootMargin is undefined when marginAroundTarget is not provided', () => {
            render(<VisibilityTracker>child</VisibilityTracker>);
            expect(latestObserver().options?.rootMargin).toBeUndefined();
        });
    });

    // ===========================================================================
    // 5. onEnter callback
    // ===========================================================================

    describe('onEnter', () => {
        it('fires onEnter when the element becomes visible', () => {
            const onEnter = jest.fn();
            render(<VisibilityTracker onEnter={onEnter}>child</VisibilityTracker>);
            act(() => latestObserver().trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(1);
        });

        it('does NOT fire onEnter when the element is not intersecting', () => {
            const onEnter = jest.fn();
            render(<VisibilityTracker onEnter={onEnter}>child</VisibilityTracker>);
            act(() => latestObserver().trigger([{ isIntersecting: false }]));
            expect(onEnter).not.toHaveBeenCalled();
        });

        it('fires onEnter at most once in one-shot mode (once=true)', () => {
            const onEnter = jest.fn();
            render(
                <VisibilityTracker onEnter={onEnter} once={true}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(1);
        });

        it('fires onEnter multiple times when once=false', () => {
            const onEnter = jest.fn();
            render(
                <VisibilityTracker onEnter={onEnter} once={false}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(2);
        });

        it('uses the latest onEnter callback (stale-closure fix)', () => {
            const firstEnter = jest.fn();
            const secondEnter = jest.fn();

            const { rerender } = render(
                <VisibilityTracker onEnter={firstEnter} once={false}>
                    child
                </VisibilityTracker>
            );

            rerender(
                <VisibilityTracker onEnter={secondEnter} once={false}>
                    child
                </VisibilityTracker>
            );

            act(() => latestObserver().trigger([{ isIntersecting: true }]));

            expect(firstEnter).not.toHaveBeenCalled();
            expect(secondEnter).toHaveBeenCalledTimes(1);
        });

        it('does not throw when onEnter is not provided', () => {
            render(<VisibilityTracker>child</VisibilityTracker>);
            expect(() => act(() => latestObserver().trigger([{ isIntersecting: true }]))).not.toThrow();
        });
    });

    // ===========================================================================
    // 6. onExit callback
    // ===========================================================================

    describe('onExit', () => {
        it('fires onExit after the element has entered and then left', () => {
            const onExit = jest.fn();
            render(<VisibilityTracker onExit={onExit}>child</VisibilityTracker>);
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenCalledTimes(1);
        });

        it('does NOT fire onExit if the element has never entered', () => {
            const onExit = jest.fn();
            render(<VisibilityTracker onExit={onExit}>child</VisibilityTracker>);
            act(() => latestObserver().trigger([{ isIntersecting: false }]));
            expect(onExit).not.toHaveBeenCalled();
        });

        it('fires onExit at most once in one-shot mode (once=true)', () => {
            const onExit = jest.fn();
            render(
                <VisibilityTracker onExit={onExit} once={true}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenCalledTimes(1);
        });

        it('fires onExit multiple times when once=false', () => {
            const onExit = jest.fn();
            render(
                <VisibilityTracker onExit={onExit} once={false}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenCalledTimes(2);
        });

        it('uses the latest onExit callback (stale-closure fix)', () => {
            const firstExit = jest.fn();
            const secondExit = jest.fn();

            const { rerender } = render(
                <VisibilityTracker onExit={firstExit} once={false}>
                    child
                </VisibilityTracker>
            );

            act(() => latestObserver().trigger([{ isIntersecting: true }]));

            rerender(
                <VisibilityTracker onExit={secondExit} once={false}>
                    child
                </VisibilityTracker>
            );

            act(() => latestObserver().trigger([{ isIntersecting: false }]));

            expect(firstExit).not.toHaveBeenCalled();
            expect(secondExit).toHaveBeenCalledTimes(1);
        });

        it('does not throw when onExit is not provided', () => {
            render(<VisibilityTracker>child</VisibilityTracker>);
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(() => act(() => obs.trigger([{ isIntersecting: false }]))).not.toThrow();
        });
    });

    // ===========================================================================
    // 7. One-shot mode — combined onEnter + onExit
    // ===========================================================================

    describe('one-shot mode (once=true)', () => {
        it('calls unobserve after both onEnter and onExit have fired', () => {
            render(
                <VisibilityTracker onEnter={jest.fn()} onExit={jest.fn()} once={true}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(obs.unobserve).not.toHaveBeenCalled();
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(obs.unobserve).toHaveBeenCalledTimes(1);
        });

        it('does not call unobserve if only onEnter has fired (no exit yet)', () => {
            render(
                <VisibilityTracker onEnter={jest.fn()} onExit={jest.fn()} once={true}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(obs.unobserve).not.toHaveBeenCalled();
        });

        it('resets one-shot flags when observer options change', () => {
            const onEnter = jest.fn();
            const { rerender } = render(
                <VisibilityTracker onEnter={onEnter} threshold="any" once={true}>
                    child
                </VisibilityTracker>
            );
            const obs1 = latestObserver();
            act(() => obs1.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(1);

            rerender(
                <VisibilityTracker onEnter={onEnter} threshold="full" once={true}>
                    child
                </VisibilityTracker>
            );
            const obs2 = latestObserver();
            act(() => obs2.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(2);
        });
    });

    // ===========================================================================
    // 8. Multiple IntersectionObserverEntry items in one callback batch
    // ===========================================================================

    describe('multiple entries in one callback', () => {
        it('processes all entries in a batch (once=false)', () => {
            const onEnter = jest.fn();
            const { container } = render(
                <VisibilityTracker onEnter={onEnter} once={false}>
                    child
                </VisibilityTracker>
            );
            const target = container.firstChild as Element;
            const obs = latestObserver();

            act(() =>
                obs.callback(
                    [
                        { isIntersecting: true, target },
                        { isIntersecting: false, target },
                        { isIntersecting: true, target },
                    ],
                    obs as unknown as IntersectionObserver
                )
            );

            expect(onEnter).toHaveBeenCalledTimes(2);
        });
    });

    // ===========================================================================
    // 9. Entry / exit counts
    // ===========================================================================

    describe('counts', () => {
        it('passes count=1 to onEnter on first entry (once=true)', () => {
            const onEnter = jest.fn();
            render(
                <VisibilityTracker onEnter={onEnter} once={true}>
                    child
                </VisibilityTracker>
            );
            act(() => latestObserver().trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledWith(1);
        });

        it('passes count=1 to onExit on first exit (once=true)', () => {
            const onExit = jest.fn();
            render(
                <VisibilityTracker onExit={onExit} once={true}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenCalledWith(1);
        });

        it('increments enter count on each entry (once=false)', () => {
            const onEnter = jest.fn();
            render(
                <VisibilityTracker onEnter={onEnter} once={false}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenNthCalledWith(1, 1);
            expect(onEnter).toHaveBeenNthCalledWith(2, 2);
            expect(onEnter).toHaveBeenNthCalledWith(3, 3);
        });

        it('increments exit count on each exit (once=false)', () => {
            const onExit = jest.fn();
            render(
                <VisibilityTracker onExit={onExit} once={false}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenNthCalledWith(1, 1);
            expect(onExit).toHaveBeenNthCalledWith(2, 2);
        });

        it('enter and exit counts are tracked independently', () => {
            const onEnter = jest.fn();
            const onExit = jest.fn();
            render(
                <VisibilityTracker onEnter={onEnter} onExit={onExit} once={false}>
                    child
                </VisibilityTracker>
            );
            const obs = latestObserver();
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenLastCalledWith(2);
            expect(onExit).toHaveBeenLastCalledWith(1);
        });

        it('resets counts when observer is re-created (options change)', () => {
            const onEnter = jest.fn();
            const { rerender } = render(
                <VisibilityTracker onEnter={onEnter} once={false} threshold="any">
                    child
                </VisibilityTracker>
            );
            const obs1 = latestObserver();
            act(() => obs1.trigger([{ isIntersecting: true }]));
            act(() => obs1.trigger([{ isIntersecting: false }]));
            act(() => obs1.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenLastCalledWith(2);

            // Changing threshold re-creates the observer and resets counts
            rerender(
                <VisibilityTracker onEnter={onEnter} once={false} threshold="full">
                    child
                </VisibilityTracker>
            );
            const obs2 = latestObserver();
            act(() => obs2.trigger([{ isIntersecting: true }]));
            // Count restarts from 1, not 3
            expect(onEnter).toHaveBeenLastCalledWith(1);
        });
    });

    // ===========================================================================
    // 10. useVisibilityTracker hook (headless)
    // ===========================================================================

    describe('useVisibilityTracker hook', () => {
        function renderHook(options: VisibilityTrackerOptions) {
            const ref = React.createRef<HTMLDivElement>();
            render(<HookWrapper targetRef={ref as React.RefObject<HTMLDivElement>} options={options} />);
            return { obs: latestObserver() };
        }

        it('creates an IntersectionObserver', () => {
            renderHook({ onEnter: jest.fn() });
            expect(observerInstances).toHaveLength(1);
        });

        it('fires onEnter via the hook', () => {
            const onEnter = jest.fn();
            const { obs } = renderHook({ onEnter, once: false });
            act(() => obs.trigger([{ isIntersecting: true }]));
            expect(onEnter).toHaveBeenCalledTimes(1);
        });

        it('fires onExit via the hook after entering', () => {
            const onExit = jest.fn();
            const { obs } = renderHook({ onExit, once: false });
            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            expect(onExit).toHaveBeenCalledTimes(1);
        });

        it('does nothing when ref.current is null', () => {
            function NullRefHook() {
                const ref = useRef<HTMLDivElement>(null);
                useVisibilityTracker(ref, { onEnter: jest.fn() });
                return <div data-testid="no-ref" />;
            }

            expect(() => render(<NullRefHook />)).not.toThrow();
            expect(observerInstances.every((o) => o.observe.mock.calls.length === 0)).toBe(true);
        });

        it('applies default options when none are provided', () => {
            const ref = React.createRef<HTMLDivElement>();
            render(<HookWrapper targetRef={ref as React.RefObject<HTMLDivElement>} options={{}} />);
            expect(latestObserver().options?.threshold).toBe(0.5);
        });
    });

    // ===========================================================================
    // 11. All props together (integration)
    // ===========================================================================

    describe('integration', () => {
        it('handles all props simultaneously', () => {
            const onEnter = jest.fn();
            const onExit = jest.fn();

            render(
                <VisibilityTracker
                    as="article"
                    threshold="full"
                    marginAroundTarget="50px"
                    once={false}
                    onEnter={onEnter}
                    onExit={onExit}
                    className="tracker"
                    data-testid="tracker"
                >
                    <p>content</p>
                </VisibilityTracker>
            );

            const el = screen.getByTestId('tracker');
            expect(el.tagName).toBe('ARTICLE');
            expect(el).toHaveClass('tracker');

            const obs = latestObserver();
            expect(obs.options?.threshold).toBe(1);
            expect(obs.options?.rootMargin).toBe('50px');

            act(() => obs.trigger([{ isIntersecting: true }]));
            act(() => obs.trigger([{ isIntersecting: false }]));
            act(() => obs.trigger([{ isIntersecting: true }]));

            expect(onEnter).toHaveBeenCalledTimes(2);
            expect(onExit).toHaveBeenCalledTimes(1);
        });

        it('does not interfere between two independent instances', () => {
            const enterA = jest.fn();
            const enterB = jest.fn();

            render(
                <>
                    <VisibilityTracker onEnter={enterA} once={false}>
                        A
                    </VisibilityTracker>
                    <VisibilityTracker onEnter={enterB} once={false}>
                        B
                    </VisibilityTracker>
                </>
            );

            expect(observerInstances).toHaveLength(2);

            act(() => observerInstances[0].trigger([{ isIntersecting: true }]));
            expect(enterA).toHaveBeenCalledTimes(1);
            expect(enterB).not.toHaveBeenCalled();

            act(() => observerInstances[1].trigger([{ isIntersecting: true }]));
            expect(enterB).toHaveBeenCalledTimes(1);
        });
    });
});

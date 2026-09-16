import type { ComponentProps, MutableRefObject } from 'react';
import { createRef, useRef } from 'react';

import { act, render } from '@testing-library/react';

import ChallengeFrame from './ChallengeFrame';
import type { ChallengeRef } from './interface';

const ORIGIN = 'https://challenge.test';
const SRC = `${ORIGIN}/challenge/v5/html?Type=0&Name=email`;

type FormProps = Partial<ComponentProps<typeof ChallengeFrame>> & { withInput?: boolean };

/** Stands in for a form that renders elsewhere in the tree and hands the frame a ref to itself. */
const Form = ({ withInput = true, ...props }: FormProps) => {
    const formRef = useRef<HTMLDivElement>(null);
    const challengeRef = useRef<ChallengeRef>();

    return (
        <>
            <div ref={formRef}>{withInput && <input id="email" />}</div>
            <ChallengeFrame challengeRef={challengeRef} observeRef={formRef} src={SRC} {...props} />
        </>
    );
};

describe('ChallengeFrame', () => {
    const setup = (props: FormProps = {}) => {
        const onSuccess = jest.fn();
        const result = render(<Form onSuccess={onSuccess} {...props} />);
        const iframe = result.container.querySelector('iframe')!;
        const postMessage = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

        /** Simulates a message coming back from the frame. */
        const emit = (data: unknown) => {
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', { data, origin: ORIGIN, source: iframe.contentWindow })
                );
            });
        };

        /** Walks the frame through the handshake. */
        const load = () => {
            emit({ type: 'init' });
            emit({ type: 'onload' });
        };

        const type = (key: string) => {
            act(() => {
                result.container
                    .querySelector('#email')!
                    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
                jest.advanceTimersByTime(0);
            });
        };

        return {
            ...result,
            rerender: (next: FormProps) => result.rerender(<Form onSuccess={onSuccess} {...next} />),
            onSuccess,
            iframe,
            postMessage,
            emit,
            load,
            type,
        };
    };

    it('clears the ref on unmount rather than leaving a destroyed controller behind', () => {
        const challengeRef = createRef<ChallengeRef>() as MutableRefObject<ChallengeRef | undefined>;
        const { container, unmount } = render(<ChallengeFrame challengeRef={challengeRef} src={SRC} />);
        jest.spyOn(container.querySelector('iframe')!.contentWindow!, 'postMessage').mockImplementation(() => {});

        expect(challengeRef.current).toBeDefined();

        unmount();

        expect(challengeRef.current).toBeUndefined();
    });

    it('leaves a ref that a remount has already claimed alone', () => {
        const challengeRef = createRef<ChallengeRef>() as MutableRefObject<ChallengeRef | undefined>;
        const { container, rerender } = render(<ChallengeFrame key="a" challengeRef={challengeRef} src={SRC} />);
        jest.spyOn(container.querySelector('iframe')!.contentWindow!, 'postMessage').mockImplementation(() => {});

        rerender(<ChallengeFrame key="b" challengeRef={challengeRef} src={SRC} />);

        // The controller belonging to the frame that is still mounted, not the one that went away.
        expect(challengeRef.current).toBeDefined();
    });

    it('renders nothing but the frame', () => {
        const challengeRef = createRef<ChallengeRef>() as MutableRefObject<ChallengeRef | undefined>;
        const { container } = render(<ChallengeFrame challengeRef={challengeRef} src={SRC} />);

        expect(container.children).toHaveLength(1);
        expect(container.firstElementChild?.tagName).toBe('IFRAME');
    });

    it('keeps the frame off-screen and out of the tab order', () => {
        const { iframe } = setup();

        expect(iframe.style.position).toBe('absolute');
        expect(iframe.style.left).toBe('-10000px');
        expect(iframe.tabIndex).toBe(-1);
        expect(iframe.getAttribute('aria-hidden')).toBe('true');
    });

    it('exposes the controller through the ref and runs the handshake', () => {
        const challengeRef = createRef<ChallengeRef>() as MutableRefObject<ChallengeRef | undefined>;
        const { container } = render(<ChallengeFrame challengeRef={challengeRef} src={SRC} />);
        const iframe = container.querySelector('iframe')!;
        const postMessage = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

        expect(challengeRef.current?.getChallenge).toBeInstanceOf(Function);
        expect(challengeRef.current?.sendEvent).toBeInstanceOf(Function);

        act(() => {
            window.dispatchEvent(
                new MessageEvent('message', { data: { type: 'init' }, origin: ORIGIN, source: iframe.contentWindow })
            );
        });

        expect(postMessage).toHaveBeenCalledWith({ type: 'load' }, ORIGIN);
    });

    describe('observing', () => {
        beforeEach(() => jest.useFakeTimers());
        afterEach(() => jest.useRealTimers());

        it('forwards interactions inside the observed element', () => {
            const { load, type, postMessage } = setup();
            load();
            postMessage.mockClear();

            type('a');

            expect(postMessage).toHaveBeenCalledWith(
                { type: 'events', payload: [expect.objectContaining({ type: 'keydown', id: 'email', key: 'a' })] },
                ORIGIN
            );
        });

        it('picks up a field that only appears on a later render', () => {
            const { load, rerender, type, postMessage } = setup({ withInput: false });
            load();

            rerender({ withInput: true });
            postMessage.mockClear();

            type('a');

            expect(postMessage).toHaveBeenCalledWith(
                { type: 'events', payload: [expect.objectContaining({ id: 'email' })] },
                ORIGIN
            );
        });

        it('stops forwarding once unmounted', () => {
            const { container, load, postMessage, unmount } = setup();
            load();

            const input = container.querySelector('#email')!;
            unmount();
            postMessage.mockClear();

            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
            jest.advanceTimersByTime(0);

            expect(postMessage).not.toHaveBeenCalled();
        });
    });

    it('calls the callbacks from the latest render, not the first', () => {
        const first = jest.fn();
        const second = jest.fn();
        const challengeRef = createRef<ChallengeRef>() as MutableRefObject<ChallengeRef | undefined>;

        const { container, rerender } = render(
            <ChallengeFrame challengeRef={challengeRef} src={SRC} onSuccess={first} />
        );
        const iframe = container.querySelector('iframe')!;
        jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

        rerender(<ChallengeFrame challengeRef={challengeRef} src={SRC} onSuccess={second} />);

        act(() => {
            [{ type: 'init' }, { type: 'onload' }].forEach((data) => {
                window.dispatchEvent(
                    new MessageEvent('message', { data, origin: ORIGIN, source: iframe.contentWindow })
                );
            });
        });

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });
});

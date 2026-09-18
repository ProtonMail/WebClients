import { useRef } from 'react';

import { act, render } from '@testing-library/react';

import Challenge from './Challenge';
import type { ChallengeRef } from './interface';

const ORIGIN = 'https://challenge.test';

/** Longer than the largest retry timeout, which tops out at 25s. */
const PAST_THE_TIMEOUT = 30000;

const Harness = ({ onError, onSuccess }: { onError?: jest.Mock; onSuccess?: jest.Mock }) => {
    const challengeRef = useRef<ChallengeRef>();

    return (
        <Challenge
            challengeRef={challengeRef}
            getSrc={(retry) => `${ORIGIN}/challenge/v5/html?Type=0&Name=email&Retry=${retry}`}
            onError={onError}
            onSuccess={onSuccess}
        />
    );
};

describe('Challenge', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const fail = () =>
        act(() => {
            jest.advanceTimersByTime(PAST_THE_TIMEOUT);
        });

    it('reloads the frame on failure', () => {
        const onError = jest.fn();
        const { container } = render(<Harness onError={onError} />);

        expect(container.querySelector('iframe')!.src).toContain('Retry=0');

        fail();
        expect(container.querySelector('iframe')!.src).toContain('Retry=1');

        fail();
        expect(container.querySelector('iframe')!.src).toContain('Retry=2');
        expect(onError).not.toHaveBeenCalled();
    });

    it('gives up after the last retry, reporting every log it collected', () => {
        const onError = jest.fn();
        const { container } = render(<Harness onError={onError} />);

        fail();
        fail();
        fail();

        expect(container.querySelector('iframe')).toBeNull();
        expect(onError).toHaveBeenCalledTimes(1);
        // One 'Added listener' step per attempt, so the logs span all three rather than just the last.
        expect(
            onError.mock.calls[0][0].filter((log: { text: string }) => log.text.includes('Added listener'))
        ).toHaveLength(3);
    });

    it('reports success without retrying', () => {
        const onSuccess = jest.fn();
        const { container } = render(<Harness onSuccess={onSuccess} />);
        const iframe = container.querySelector('iframe')!;
        jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

        act(() => {
            [{ type: 'init' }, { type: 'onload' }].forEach((data) => {
                window.dispatchEvent(
                    new MessageEvent('message', { data, origin: ORIGIN, source: iframe.contentWindow })
                );
            });
        });

        expect(onSuccess).toHaveBeenCalledTimes(1);

        fail();
        expect(container.querySelector('iframe')!.src).toContain('Retry=0');
    });
});

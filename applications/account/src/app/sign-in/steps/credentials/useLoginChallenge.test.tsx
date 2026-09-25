import type { Ref } from 'react';
import { useState } from 'react';

import { act, render } from '@testing-library/react';

import { useLoginChallenge } from './useLoginChallenge';

jest.mock('@proton/account/staticExperiments/useStaticExperiment', () => ({
    useStaticExperiment: () => 'v5',
}));

/** A form that owns its field's state, like the credentials forms, so typing doesn't re-render the challenge. */
const UsernameForm = ({ usernameRef }: { usernameRef: Ref<HTMLInputElement> }) => {
    const [value, setValue] = useState('');
    return <input id="username" ref={usernameRef} value={value} onChange={(event) => setValue(event.target.value)} />;
};

const LoginChallengeForm = ({ mode }: { mode: string }) => {
    const challenge = useLoginChallenge();
    return (
        <>
            {challenge.element}
            <UsernameForm key={mode} usernameRef={challenge.usernameRef} />
        </>
    );
};

describe('useLoginChallenge', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const setup = () => {
        const result = render(<LoginChallengeForm mode="srp" />);
        const iframe = result.container.querySelector('iframe')!;
        const postMessage = jest.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});

        act(() => {
            [{ type: 'init' }, { type: 'onload' }].forEach((data) => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data,
                        origin: new URL(iframe.src).origin,
                        source: iframe.contentWindow,
                    })
                );
            });
        });

        const type = (key: string) => {
            postMessage.mockClear();
            act(() => {
                result.container
                    .querySelector('#username')!
                    .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
                jest.advanceTimersByTime(0);
            });
        };

        return { ...result, postMessage, type };
    };

    const usernameEvents = { type: 'events', payload: [expect.objectContaining({ id: 'username' })] };

    it('observes the username input from the first render', () => {
        const { postMessage, type } = setup();

        type('a');

        expect(postMessage).toHaveBeenCalledWith(usernameEvents, expect.any(String));
    });

    it('follows the username input of the next form on a mode switch', () => {
        const { postMessage, rerender, type } = setup();

        rerender(<LoginChallengeForm mode="sso" />);
        type('a');

        expect(postMessage).toHaveBeenCalledWith(usernameEvents, expect.any(String));
    });
});

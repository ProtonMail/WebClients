import { type EventObject, createActor, fromCallback, fromPromise, waitFor } from 'xstate';

import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

import type { PullEvent } from './signInWithAnotherDeviceStateMachine';
import { selectQrCode, signInWithAnotherDeviceStateMachine } from './signInWithAnotherDeviceStateMachine';

const session = { localID: 1 } as unknown as ResumedSessionResult;

const start = ({ signIn = () => Promise.resolve() }: { signIn?: () => Promise<void> } = {}) => {
    const pulls: { send: (event: PullEvent) => void; stopped: boolean }[] = [];
    const traced = jest.fn();
    const actor = createActor(
        signInWithAnotherDeviceStateMachine.provide({
            actors: {
                pull: fromCallback<EventObject>(({ sendBack }) => {
                    const pull = { send: (event: PullEvent) => sendBack(event), stopped: false };
                    pulls.push(pull);
                    return () => {
                        pull.stopped = true;
                    };
                }),
                signIn: fromPromise(signIn),
            },
        })
    );
    actor.on('signIn.failed', ({ error }) => traced(error));
    actor.start();
    return { actor, pulls, traced };
};

describe('signInWithAnotherDeviceStateMachine', () => {
    it('shows the QR code while it polls', () => {
        const { actor, pulls } = start();
        expect(selectQrCode(actor.getSnapshot())).toBeUndefined();
        pulls[0].send({ type: 'pull.qrCodeCreated', qrCode: 'qr' });
        expect(selectQrCode(actor.getSnapshot())).toBe('qr');
    });

    it('signs in with the session the other device hands over, and stops polling', () => {
        const signIn = jest.fn(() => new Promise<void>(() => {}));
        const { actor, pulls } = start({ signIn });
        pulls[0].send({ type: 'pull.qrCodeCreated', qrCode: 'qr' });
        pulls[0].send({ type: 'pull.signedIn', session, forkDurationTime: 1000 });
        expect(actor.getSnapshot().value).toBe('signingIn');
        expect(selectQrCode(actor.getSnapshot())).toBeUndefined();
        expect(signIn).toHaveBeenCalled();
        expect(pulls[0].stopped).toBe(true);
    });

    it('shows a failed sign-in and starts a new poll when asked for a new QR code', async () => {
        const error = new Error('Session expired');
        const { actor, pulls, traced } = start({ signIn: () => Promise.reject(error) });
        pulls[0].send({ type: 'pull.signedIn', session, forkDurationTime: 1000 });
        await waitFor(actor, (state) => state.matches('failed'));
        expect(actor.getSnapshot().context.error).toBe(error);
        expect(traced).toHaveBeenCalledWith(error);

        actor.send({ type: 'qrCode.requested' });
        expect(actor.getSnapshot().value).toBe('pulling');
        expect(actor.getSnapshot().context.error).toBeUndefined();
        expect(pulls).toHaveLength(2);
    });

    it('shows a failed poll', () => {
        const error = new Error('QR code expired');
        const { actor, pulls, traced } = start();
        pulls[0].send({ type: 'pull.failed', error });
        expect(actor.getSnapshot().value).toBe('failed');
        expect(actor.getSnapshot().context.error).toBe(error);
        expect(traced).toHaveBeenCalledWith(error);
    });
});

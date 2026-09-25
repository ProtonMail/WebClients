/** Transitions, guards and placeholders the sign-in's machines share. Each machine defines its own `reportError` action. */
import { type AnyActorLogic, fromPromise } from 'xstate';

/**
 * Placeholders for the actors a machine takes from the app: `useSignInMachine` (or a test) provides them. Running one
 * that wasn't provided fails its state like a failed request, naming the actor, instead of the machine crashing.
 * Listing every name (checked against the type) keeps the placeholders complete.
 */
export const unprovidedActors = <TActors extends Record<string, AnyActorLogic>>(
    names: Record<keyof TActors, true>
): TActors =>
    Object.fromEntries(
        Object.keys(names).map((name) => [
            name,
            fromPromise(() => Promise.reject(new Error(`The sign-in's ${name} actor is not provided`))),
        ])
    ) as unknown as TActors;

/** The body of an action the app provides (see `unprovidedActors`): one that wasn't provided fails loudly. */
export const unprovidedAction = (name: string): never => {
    throw new Error(`The sign-in's ${name} action is not provided`);
};

/** Hands a failed actor's error to the machine's `reportError` action. */
export const reportActorError = {
    type: 'reportError' as const,
    params: ({ event }: { event: { error: unknown } }) => ({ error: event.error }),
};

/** Sent to the sign-in by a step (the credentials step or an account flow) to show an error while it continues. */
export interface StepErrorEvent {
    type: 'step.errorReported';
    payload: { error: unknown };
}

type ErrorClass = abstract new (...args: never[]) => Error;

/** Guard: the failed request's error is of this class (a wrong code is a `TOTPError`, a wrong password a `PasswordError`). */
export const isErrorOf = (_: unknown, params: { error: unknown; errorClass: ErrorClass }) =>
    params.error instanceof params.errorClass;

/** Guard params for `isErrorOf`: the failed request's error is of this class. */
export const errorOf = (errorClass: ErrorClass) => ({
    type: 'isErrorOf' as const,
    params: ({ event }: { event: { error: unknown } }) => ({ error: event.error, errorClass }),
});

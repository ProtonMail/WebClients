import type { Storage } from '@proton/pass/types';
import { type Maybe, type OnboardingAcknowledgment, OnboardingMessage, type OnboardingState } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import identity from '@proton/utils/identity';

export type OnboardingStorageData = { onboarding: string };

export type OnboardingServiceOptions = {
    /** defines where onboarding data will be stored */
    storage: Storage<OnboardingStorageData>;
    /** defines which onboarding rule this service supports  */
    rules: OnboardingRule[];
};

export type OnboardingWhen = (previousAck: Maybe<OnboardingAcknowledgment>, state: OnboardingState) => boolean;
export type OnboardingAck = (ack: OnboardingAcknowledgment) => OnboardingAcknowledgment;
export type OnboardingRule = {
    /** Onboarding message type */
    message: OnboardingMessage;
    /** Given any previous acknowledgments for this particular message and the
     * current onboarding service state, should return a boolean flag indicating
     * wether this rule should be triggered */
    when?: OnboardingWhen;
    /** Optional callback that will be executed when this particular onboarding
     * message is acknowledged */
    onAcknowledge?: OnboardingAck;
};

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
    installedOn: getEpoch(),
    updatedOn: -1,
    acknowledged: [],
};

export const createOnboardingRule = (options: OnboardingRule): OnboardingRule => ({
    message: options.message,
    onAcknowledge: options.onAcknowledge,
    when: (previousAck, state) =>
        options.when?.(previousAck, state) ?? !state.acknowledged.some((data) => data.message === options.message),
});

export const createOnboardingService = (options: OnboardingServiceOptions) => {
    const state: OnboardingState = { ...INITIAL_ONBOARDING_STATE };

    /** Sets the onboarding service state and updates the storage */
    const setState = (update: Partial<OnboardingState>) => {
        state.acknowledged = update.acknowledged ?? state.acknowledged;
        state.installedOn = update.installedOn ?? state.installedOn;
        state.updatedOn = update.updatedOn ?? state.updatedOn;
        void options.storage.setItem('onboarding', JSON.stringify(state));
    };

    /* Define extra rules in the `ONBOARDING_RULES` constant :
     * we will resolve the first message that matches the rule's
     * `when` condition */
    const getMessage = () => ({
        message:
            options.rules.find(
                ({ message, when }) =>
                    when?.(
                        state.acknowledged.find((ack) => message === ack.message),
                        state
                    )
            )?.message ?? null,
    });

    /** Resets the state's acknowledged message list. This may be
     * useful when logging out a user - preserves timestamps */
    const reset = () => setState({ acknowledged: [] });

    /** Acknowledges the given onboarding message by either pushing
     * it to the acknowledged messages list or updating the entry */
    const acknowledge = (message: OnboardingMessage) => {
        logger.info(`[Worker::Onboarding] Acknowledging "${OnboardingMessage[message]}"`);
        const acknowledged = state.acknowledged.find((data) => data.message === message);
        const onAcknowledge = options.rules.find((rule) => rule.message === message)?.onAcknowledge ?? identity;

        setState({
            acknowledged: [
                ...state.acknowledged.filter((data) => data.message !== message),
                onAcknowledge({ message, acknowledgedOn: getEpoch(), count: (acknowledged?.count ?? 0) + 1 }),
            ],
        });

        return true;
    };

    const init = async () => {
        try {
            const onboarding = await options.storage.getItem('onboarding');
            if (typeof onboarding === 'string') setState(JSON.parse(onboarding));
            else throw Error('Onboarding data not found');
        } catch {
            setState(state);
        }
    };

    return { acknowledge, init, reset, setState, getMessage, state };
};

export type OnboardingService = ReturnType<typeof createOnboardingService>;

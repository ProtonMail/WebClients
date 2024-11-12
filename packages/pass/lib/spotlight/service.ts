import type { AnyStorage, MaybePromise } from '@proton/pass/types';
import { type Maybe, type SpotlightAcknowledgment, SpotlightMessage, type SpotlightState } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import identity from '@proton/utils/identity';

type SpotlightServiceOptions<StorageKey extends string> = {
    /** defines where spotlight data will be stored */
    storage: AnyStorage<Record<StorageKey, string>>;
    /** defines which spotlight rule this service supports  */
    rules: SpotlightRule[];
    /** resolves the storage key for the current user */
    getStorageKey: () => StorageKey;
    /** triggered on OnboardingService::init before hydration */
    migrate?: (storageKey: StorageKey) => void;
};

export type SpotlightWhen = (previousAck: Maybe<SpotlightAcknowledgment>, state: SpotlightState) => boolean;
export type SpotlightAck = (ack: SpotlightAcknowledgment) => SpotlightAcknowledgment;
export type SpotlightRule = {
    /** Onboarding message type */
    message: SpotlightMessage;
    /** Given any previous acknowledgments for this particular message and the
     * current spotlight service state, should return a boolean flag indicating
     * wether this rule should be triggered */
    when?: SpotlightWhen;
    /** Optional callback that will be executed when this particular spotlight
     * message is acknowledged */
    onAcknowledge?: SpotlightAck;
};

export const INITIAL_SPOTLIGHT_STATE: SpotlightState = {
    installedOn: getEpoch(),
    updatedOn: -1,
    acknowledged: [],
};

export const createSpotlightRule = (options: SpotlightRule): SpotlightRule => ({
    message: options.message,
    onAcknowledge: options.onAcknowledge,
    when: (previousAck, state) =>
        options.when?.(previousAck, state) ?? !state.acknowledged.some((data) => data.message === options.message),
});

export const createSpotlightService = <StorageKey extends string>(options: SpotlightServiceOptions<StorageKey>) => {
    const state: SpotlightState = { ...INITIAL_SPOTLIGHT_STATE };

    /** Sets the spotlight service state and updates the storage */
    const setState = (update: Partial<SpotlightState>) => {
        state.acknowledged = update.acknowledged ?? state.acknowledged;
        state.installedOn = update.installedOn ?? state.installedOn;
        state.updatedOn = update.updatedOn ?? state.updatedOn;
        void options.storage.setItem(options.getStorageKey(), JSON.stringify(state));
    };

    const checkRule = (rule: SpotlightRule): boolean => {
        if (!rule.when) return true;

        const ack = state.acknowledged.find((ack) => rule.message === ack.message);
        return rule.when(ack, state);
    };

    const checkMessage = (message: SpotlightMessage): { enabled: boolean } => {
        const rule = options.rules.find((rule) => rule.message === message);
        return { enabled: rule ? checkRule(rule) : false };
    };

    /* Define extra rules in the `ONBOARDING_RULES` constant :
     * we will resolve the first message that matches the rule's
     * `when` condition */
    const getMessage = () => ({ message: options.rules.find(checkRule)?.message ?? null });

    /** Resets the state's acknowledged message list. This may be
     * useful when logging out a user - preserves timestamps */
    const reset = () => setState({ acknowledged: [] });

    /** Acknowledges the given spotlight message by either pushing
     * it to the acknowledged messages list or updating the entry */
    const acknowledge = (message: SpotlightMessage) => {
        logger.info(`[Onboarding] Acknowledging "${SpotlightMessage[message]}"`);
        const acknowledged = state.acknowledged.find((data) => data.message === message);
        const onAcknowledge = options.rules.find((rule) => rule.message === message)?.onAcknowledge ?? identity;

        setState({
            acknowledged: [
                ...state.acknowledged.filter((data) => data.message !== message),
                onAcknowledge({
                    ...(acknowledged ?? {}),
                    message,
                    acknowledgedOn: getEpoch(),
                    count: (acknowledged?.count ?? 0) + 1,
                }),
            ],
        });

        return true;
    };

    const init = async () => {
        try {
            const key = options.getStorageKey();
            options.migrate?.(key);
            const data = await options.storage.getItem(key);
            if (typeof data === 'string') setState(JSON.parse(data));
            else throw Error('Spotlight data not found');
        } catch {
            setState(state);
        }
    };

    return { acknowledge, checkMessage, init, reset, setState, getMessage, state };
};

export type SpotlightService = ReturnType<typeof createSpotlightService>;

export type SpotlightProxy = {
    /** Acknowledge a spotlight message */
    check: (message: SpotlightMessage) => MaybePromise<boolean>;
    /** Returns `true` if a spotlight message should show */
    acknowledge: (message: SpotlightMessage) => MaybePromise<boolean>;
};

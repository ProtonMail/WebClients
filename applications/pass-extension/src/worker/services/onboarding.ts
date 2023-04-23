import { browserLocalStorage } from '@proton/pass/extension/storage';
import { selectCanLockSession } from '@proton/pass/store';
import { type Maybe, OnboardingMessage, type OnboardingState, WorkerMessageType } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object';
import { UNIX_DAY, getEpoch } from '@proton/pass/utils/time';

import { INITIAL_ONBOARDING_STATE } from '../../shared/constants';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { WorkerContextInterface } from '../context/types';
import store from '../store';

type OnboardingContext = { state: OnboardingState };
type OnboardingRule = {
    message: OnboardingMessage;
    when: (ctx: WorkerContextInterface, state: OnboardingState) => boolean;
};

const createOnboardingRule = (message: OnboardingMessage, when?: OnboardingRule['when']): OnboardingRule => ({
    message,
    when: (ctx, state) => when?.(ctx, state) ?? !state.acknowledged.some((data) => data.message === message),
});

/* Define the onboarding rules here :
 * - each rule must be registered on a specific `OnboardingMessage` type
 * - define an optional predicate for when to show the message
 * - order is important: we will apply the first matched rule */
const ONBOARDING_RULES: OnboardingRule[] = [
    createOnboardingRule(OnboardingMessage.UPDATE_AVAILABLE, (ctx) => ctx.service.activation.shouldUpdate()),
    createOnboardingRule(OnboardingMessage.WELCOME, () => false),
    createOnboardingRule(OnboardingMessage.SECURE_EXTENSION, (_ctx, { installedOn, acknowledged }) => {
        const now = getEpoch();
        const ack = acknowledged.some(({ message }) => message === OnboardingMessage.SECURE_EXTENSION);

        /* only prompt if user has no lock */
        if (ack || selectCanLockSession(store.getState())) return false;
        return now - installedOn > UNIX_DAY;
    }),
];

export const createOnboardingService = () => {
    const ctx: OnboardingContext = { state: INITIAL_ONBOARDING_STATE };

    /* Every setState call will have the side-effect of
     * updating the locally stored onboarding state  */
    const setState = (state: Partial<OnboardingState>) => {
        ctx.state = merge(ctx.state, state);
        void browserLocalStorage.setItem('onboarding', JSON.stringify(ctx.state));
    };

    const onInstall = () => setState({ installedOn: getEpoch() });
    const onUpdate = () => setState({ updatedOn: getEpoch() });

    /* Reset the state's acknowledged messages. This may be
     * useful when logging out a user - preserves timestamps */
    const reset = () => setState({ acknowledged: [] });

    /* Acknowledges the current onboarding message by either pushing
     * it to the acknowledged messages list or updating the entry */
    const acknowledge = (message: OnboardingMessage) => {
        logger.info(`[Worker::Onboarding] Acknowledging "${OnboardingMessage[message]}"`);
        const acknowledged = ctx.state.acknowledged.find((data) => data.message === message);

        setState({
            acknowledged: [
                ...ctx.state.acknowledged.filter((data) => data.message !== message),
                { message, acknowledgedOn: getEpoch(), count: (acknowledged?.count ?? 0) + 1 },
            ],
        });

        return true;
    };

    /* Define extra rules in the `ONBOARDING_RULES` constant :
     * we will resolve the first message that matches the rule's
     * `when` condition */
    const getMessage = withContext<() => Maybe<OnboardingMessage>>(
        (workerCtx) => ONBOARDING_RULES.find(({ when }) => when(workerCtx, ctx.state))?.message
    );

    /* hydrate the onboarding state value from the storage
     * on service creation. This will noop on first install */
    void browserLocalStorage.getItem('onboarding').then((data) => data && setState(JSON.parse(data)));

    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_REQUEST, () => ({ message: getMessage() }));

    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_ACK, withPayloadLens('message', acknowledge));

    return { reset, onInstall, onUpdate };
};

export type OnboardingService = ReturnType<typeof createOnboardingService>;

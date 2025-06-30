import { createPubSub } from '@proton/pass/utils/pubsub/factory';

/**
 * Base interface for saga event definitions. This interface is designed to be
 * extended via module declaration merging to define application-specific event types.
 * This pattern allows event definitions to be collocated with the code that publishes.
 *
 * @example
 * ```typescript
 * declare module '@proton/pass/store/events' {
 *   interface SagaEvents {
 *     'user::login': { userId: string; timestamp: number };
 *     'vault::created': { vaultId: string; name: string };
 *   }
 * }
 * ```
 */
export interface SagaEvents {}

export type SagaEvent = {
    [K in keyof SagaEvents]: {
        type: K;
        data: SagaEvents[K];
    };
}[keyof SagaEvents];

export const sagaEvents = createPubSub<SagaEvent>();

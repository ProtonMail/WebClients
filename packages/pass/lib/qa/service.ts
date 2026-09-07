import noop from '@proton/utils/noop';

import type { MaybeNull, Storage } from '../../types';
import { logger } from '../../utils/logger';
import { objectEntries, objectKeys } from '../../utils/object/generic';
import { createPubSub } from '../../utils/pubsub/factory';

export const QA_STATE_KEY = 'pass::qa';

export type QAState = {
    login_without_offline_components: boolean;
    api_downtime: boolean;
    /** HTTP status forced on `auth/refresh`, `false` to disable */
    refresh_status: number | false;
    sync_strategy_v2: boolean;
};

const QA_DEFAULT_STATE: QAState = {
    login_without_offline_components: false,
    api_downtime: false,
    refresh_status: false,
    sync_strategy_v2: true,
};

export const QA_SCENARIOS = objectKeys<QAScenario>(QA_DEFAULT_STATE);

export type QAScenario = keyof QAState;
export type QAEvent = { [K in QAScenario]: { type: K; enabled: QAState[K] } }[QAScenario];
export type QAStorage = { ['pass::qa']: string };

export const QA_SERVICE =
    ENV === 'development'
        ? (() => {
              let store: MaybeNull<Storage<QAStorage>> = null;
              const state: QAState = { ...QA_DEFAULT_STATE };
              const pubsub = createPubSub<QAEvent>();

              const onScenarioUpdate = <K extends QAScenario>(type: K, enabled: QAState[K]) => {
                  logger.debug(`[QAService] ${type}=${enabled}`);
                  state[type] = enabled;
                  pubsub.publish({ type, enabled } as QAEvent);
              };

              QA_SCENARIOS.forEach((type) => {
                  const self = globalThis as any;
                  self[`qa::${type}`] = (enabled: QAState[typeof type]) => {
                      onScenarioUpdate(type, enabled);
                      void store?.setItem(QA_STATE_KEY, JSON.stringify(state));
                  };
              });

              return {
                  subscribe: pubsub.subscribe,
                  init: (storage: Storage<QAStorage>) => {
                      try {
                          store = storage;
                          void Promise.resolve(store.getItem(QA_STATE_KEY))
                              .then((stored) => {
                                  const data: QAState = stored ? JSON.parse(stored) : {};
                                  objectEntries(data).forEach(([type, enabled]) => onScenarioUpdate(type, enabled));
                              })
                              .catch(noop);
                      } catch {}
                  },
                  state,
              };
          })()
        : null;

import noop from '@proton/utils/noop';

import type { MaybeNull, Storage } from '../../types';
import { logger } from '../../utils/logger';
import { objectEntries } from '../../utils/object/generic';
import { createPubSub } from '../../utils/pubsub/factory';

export const QA_SCENARIOS = ['login_without_offline_components', 'api_downtime', 'sync_strategy_v2'] as const;
export const QA_STATE_KEY = 'pass::qa';

export type QAScenario = (typeof QA_SCENARIOS)[number];
export type QAEvent = { type: QAScenario; enabled: boolean };
export type QAState = Record<QAScenario, boolean>;
export type QAStorage = { ['pass::qa']: string };

export const QA_SERVICE =
    ENV === 'development'
        ? (() => {
              let store: MaybeNull<Storage<QAStorage>> = null;
              const state: QAState = {
                  login_without_offline_components: false,
                  api_downtime: false,
                  sync_strategy_v2: true,
              };
              const pubsub = createPubSub<QAEvent>();

              const onScenarioUpdate = (type: QAScenario, enabled: boolean) => {
                  logger.debug(`[QAService] ${type}=${enabled}`);
                  state[type] = enabled;
                  pubsub.publish({ type, enabled });
              };

              QA_SCENARIOS.forEach((type) => {
                  const self = globalThis as any;
                  self[`qa::${type}`] = (enabled: boolean) => {
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

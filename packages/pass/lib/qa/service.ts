import type { MaybeNull, Storage } from '@proton/pass/types';
import { fromEntries, objectEntries } from '@proton/pass/utils/object/generic';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

const QA_SCENARIOS = ['login_without_offline_components', 'api_downtime'] as const;
const QA_STATE_KEY = 'pass::qa';

export type QAScenario = (typeof QA_SCENARIOS)[number];
export type QAEvent = { type: QAScenario; enabled: boolean };
export type QAState = Record<QAScenario, boolean>;

export const QA_SERVICE =
    ENV === 'development'
        ? (() => {
              let store: MaybeNull<Storage> = null;
              const state: QAState = fromEntries<QAScenario, boolean>(
                  QA_SCENARIOS.map((scenario) => [scenario, false])
              );
              const pubsub = createPubSub<QAEvent>();

              QA_SCENARIOS.forEach((type) => {
                  const self = globalThis as any;
                  self[`qa::${type}`] = (enabled: boolean) => {
                      pubsub.publish({ type, enabled });
                      state[type] = enabled;
                      void store?.setItem(QA_STATE_KEY, JSON.stringify(state));
                  };
              });

              return {
                  subscribe: pubsub.subscribe,
                  init: (storage: Storage) => {
                      try {
                          store = storage;
                          const data: QAState = JSON.parse(store.getItem(QA_STATE_KEY));
                          objectEntries(data).forEach(([scenario, enabled]) => (state[scenario] = enabled));
                      } catch {}
                  },
                  state,
              };
          })()
        : null;

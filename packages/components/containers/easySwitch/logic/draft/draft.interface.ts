import { ImportAuthType, ImportProvider, ImportType } from '../types/shared.types';

export enum DraftStep {
    IDLE = 'idle',
    START = 'start',
}

export type DraftState = {
    ui:
        | {
              step: DraftStep.IDLE;
          }
        | {
              step: DraftStep.START;
              authType: ImportAuthType;
              provider: ImportProvider;
              // IMAP import type is always a single value
              // OAUTH import type can be multiple values
              importType?: ImportType | ImportType[];
              hasReadInstructions: boolean;
          };
};

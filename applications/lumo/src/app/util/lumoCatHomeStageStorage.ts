import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const LUMO_CAT_HOME_STAGE_KEY = 'lumo-cat-home-stage';

export type PersistedLumoCatHomeStage = 'inside-stable' | 'outside-stable';

export const getPersistedLumoCatHomeStage = (): PersistedLumoCatHomeStage => {
    const stored = readScopedLocalStorageJson<unknown>(LUMO_CAT_HOME_STAGE_KEY, 'inside-stable');

    return stored === 'outside-stable' ? 'outside-stable' : 'inside-stable';
};

export const persistLumoCatHomeStage = (stage: PersistedLumoCatHomeStage): void => {
    writeScopedLocalStorageJson(LUMO_CAT_HOME_STAGE_KEY, stage);
};

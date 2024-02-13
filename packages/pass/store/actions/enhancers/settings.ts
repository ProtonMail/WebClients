import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type SettingsMeta = { settings: true };
export type WithSettingsAction<A = Action> = WithMeta<SettingsMeta, A>;

export const withSettings = withMetaFactory<SettingsMeta>({ settings: true });

export const isSettingsAction = <T extends Action>(action?: T): action is WithSettingsAction<T> =>
    (action as any)?.meta?.settings === true;

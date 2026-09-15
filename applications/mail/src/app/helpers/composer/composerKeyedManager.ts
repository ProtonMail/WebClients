import type { ComposerID } from '../../store/composers/composerTypes';

export interface ComposerKeyedManager<TValue> {
    get: (composerID: ComposerID) => TValue | undefined;
    set: (composerID: ComposerID, value: TValue) => void;
    delete: (composerID: ComposerID) => void;
}

export const createComposerKeyedManager = <TValue>(): ComposerKeyedManager<TValue> => {
    const values = new Map<ComposerID, TValue>();

    return {
        get: (composerID) => values.get(composerID),
        set: (composerID, value) => {
            values.set(composerID, value);
        },
        delete: (composerID) => {
            values.delete(composerID);
        },
    };
};

import Store from "electron-store";

const store = new Store();

export type TrialStatus = "trialEnded" | "resetTrialEnded";

export const saveTrialStatus = (status: TrialStatus) => {
    if (status === "resetTrialEnded") {
        store.delete("trialEnd");
    } else {
        store.set("trialEnd", status);
    }
};

export const hasTrialEnded = (): boolean => {
    return store.get("trialEnd") === "trialEnded";
};

export const getTrialStatus = (): TrialStatus | undefined => {
    return store.get("trialEnd") as TrialStatus | undefined;
};

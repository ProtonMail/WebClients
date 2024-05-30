import Store from "electron-store";

const store = new Store();

// Delete the old window store for a fresh start
const deleteWindowStore = () => {
    store.delete(`WindowsStore-MAIL`);
    store.delete(`WindowsStore-CALENDAR`);
};

// Delete URL store to increase security
const deleteURLStore = () => {
    store.delete("appURL");
    store.delete("HardcodedUrls");
};

// Delete the trialEnd store as it is not needed anymore
const deleteTrialEndStore = () => {
    store.delete("trialEnd");
};

export const performStoreMigrations = () => {
    deleteWindowStore(); // Introduced in v0.9.4
    deleteURLStore(); // Introduced in v1.0.0
    deleteTrialEndStore(); // Introduced in v1.0.0
};

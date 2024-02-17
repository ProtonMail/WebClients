import Store from "electron-store";

const store = new Store();

// Delete the old window store for a fresh start
export const deleteWindowStore = () => {
    store.delete(`WindowsStore-MAIL`);
    store.delete(`WindowsStore-CALENDAR`);
};

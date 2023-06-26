import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

export const SESSIONS_STORAGE_KEY = 'checklistCheckedAccounts';

const getData = () => {
    return JSON.parse(getItem(SESSIONS_STORAGE_KEY) || '{}');
};

export const saveCheckedItemsForUser = (userId: string, newCheckedItems: string[]) => {
    const services = getData();
    setItem(SESSIONS_STORAGE_KEY, JSON.stringify({ ...services, [userId]: { items: newCheckedItems } }));
};

export const getSavedCheckedItemsForUser = (userId: string) => {
    const services = getData();
    return services[userId]?.items ?? [];
};

export const deleteCheckedItemsForUser = (userId: string) => {
    const services = getData();
    delete services[userId];
    setItem(SESSIONS_STORAGE_KEY, JSON.stringify(services));
};

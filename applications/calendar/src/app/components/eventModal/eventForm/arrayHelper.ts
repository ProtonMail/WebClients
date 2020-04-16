export const addItem = <T>(array: T[], item: T) => array.concat(item);
export const updateItem = <T>(array: T[], index: number, newItem: T) => {
    return array.map((item, i) => {
        if (i !== index) {
            return item;
        }
        return newItem;
    });
};
export const removeItem = <T>(array: T[], index: number) => array.filter((oldValue, i) => i !== index);

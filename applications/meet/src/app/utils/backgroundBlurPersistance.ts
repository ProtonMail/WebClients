export const getPersistedBackgroundBlur = () => {
    const persistedBackgroundBlur = localStorage.getItem('meetBackgroundBlur');
    return persistedBackgroundBlur === 'true';
};

export const persistBackgroundBlur = (backgroundBlur: boolean) => {
    localStorage.setItem('meetBackgroundBlur', backgroundBlur.toString());
};

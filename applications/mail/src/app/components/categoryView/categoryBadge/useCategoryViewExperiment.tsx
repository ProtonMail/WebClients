import useFlag from '@proton/unleash/useFlag';

export const useCategoryViewExperiment = () => {
    const isAvailable = useFlag('ShowMessageCategory');

    return {
        canSeeCategoryLabel: isAvailable,
    };
};

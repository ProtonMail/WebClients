import useFlag from '@proton/unleash/useFlag';

export const useCategoryViewExperiment = () => {
    const showCategoryBadges = useFlag('ShowMessageCategory');
    const categoryViewAccess = useFlag('CategoryView');

    return {
        canSeeCategoryLabel: showCategoryBadges && !categoryViewAccess,
    };
};

import useFlag from '@proton/unleash/useFlag';

export const useCategoryViewExperiment = () => {
    const isAvailable = useFlag('ShowMessageCategory');
    const mailCategoryView = useFlag('MailCategoryView');

    return {
        canSeeCategoryLabel: false && isAvailable && mailCategoryView,
    };
};

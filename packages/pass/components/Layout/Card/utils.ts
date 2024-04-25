export type CardType = 'success' | 'warning' | 'danger' | 'primary';

export const getCardTheme = (type?: CardType): string => {
    switch (type) {
        case 'warning':
            return 'ui-orange';
        case 'danger':
            return 'ui-red';
        case 'success':
            return 'ui-teal';
        case 'primary':
            return 'ui-primary';
        default:
            return 'ui-standard';
    }
};

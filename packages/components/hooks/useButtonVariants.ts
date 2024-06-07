import { useMemo } from 'react';

import { useFlag, useVariant } from '@unleash/proxy-client-react';

import { SHARED_UPSELL_PATHS } from '@proton/shared/lib/constants';

import useUser from './useUser';

export interface VariantInfos {
    additionnalStylesClass?: string;
    upsellPath: SHARED_UPSELL_PATHS;
}

enum BUTTONS_VARIANTS {
    STANDARD = 'STANDARD',
    RED = 'RED',
    YELLOW = 'YELLOW',
    PINKBLUE = 'PINKBLUE',
}

const useButtonVariants = () => {
    const [user] = useUser();
    const hasPaidMail = user.hasPaidMail;

    const InboxFreeUserRotatingButtonStyles = useFlag('InboxFreeUserRotatingButtonStyles');
    const InboxFreeUserRotatingButtonStylesVariant = useVariant('InboxFreeUserRotatingButtonStyles');
    const variantValue =
        (InboxFreeUserRotatingButtonStylesVariant?.payload?.value as BUTTONS_VARIANTS) || BUTTONS_VARIANTS.STANDARD;

    const shouldDisplayVariant =
        !hasPaidMail && InboxFreeUserRotatingButtonStyles && InboxFreeUserRotatingButtonStylesVariant;
    // if experiment is ongoing AND for MAIL/CALENDAR Free users only

    const getVariant = (variant: BUTTONS_VARIANTS) => {
        switch (variant) {
            case BUTTONS_VARIANTS.RED:
                return {
                    additionnalStylesClass: 'button-promotion--red',
                    upsellPath: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR_RED,
                };
                break;
            case BUTTONS_VARIANTS.YELLOW:
                return {
                    additionnalStylesClass: 'button-promotion--yellow',
                    upsellPath: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR_YELLOW,
                };
                break;
            case BUTTONS_VARIANTS.PINKBLUE:
                return {
                    additionnalStylesClass: 'button-promotion--pinkblue',
                    upsellPath: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR_PINKBLUE,
                };
                break;
            case BUTTONS_VARIANTS.STANDARD:
                return {
                    additionnalStylesClass: '',
                    upsellPath: SHARED_UPSELL_PATHS.TOP_NAVIGATION_BAR,
                };
                break;
        }
    };

    const variantInfos = useMemo(() => {
        return getVariant(variantValue);
    }, [variantValue]);

    return {
        shouldDisplayVariant,
        variantInfos,
    };
};

export default useButtonVariants;

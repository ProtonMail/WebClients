import type { UpsellModalTypes } from '@proton/meet/types/types';

export type CTAModalBaseProps = {
    open: boolean;
    onClose: () => void;
    rejoin?: () => void;
    action: () => void;
    upsellModalType?: UpsellModalTypes;
};

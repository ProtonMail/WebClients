import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';

import UpsellModal from '../UpsellModal';

export const useUpsellStep = () => {
    const [upsellModal, showUpsellModal] = useModalTwo(UpsellModal);

    return { modal: upsellModal, show: showUpsellModal };
};

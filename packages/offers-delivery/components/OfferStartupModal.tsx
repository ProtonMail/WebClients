import StartupModals from '@proton/components/components/startupModals/StartupModals';

import { useOfferStartupModal } from './useOfferStartupModal';

/** For hosts without a `StartupModals` list of their own. */
export const OfferStartupModal = () => {
    const offerModal = useOfferStartupModal();

    return <StartupModals modals={[offerModal]} />;
};

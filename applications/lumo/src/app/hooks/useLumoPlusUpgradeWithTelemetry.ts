import { useCallback } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import { useModalStateObject } from '@proton/components';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { sendUpgradeButtonClickedEvent } from '../util/telemetry';

interface Props {
    feature: UPSELL_FEATURE;
}

const useLumoPlusUpgradeWithTelemetry = ({ feature }: Props) => {
    const { APP_NAME } = useConfig();
    const lumoPlusUpsellModal = useModalStateObject();

    const upsellRef = getUpsellRefFromApp({
        app: APP_NAME,
        feature,
        component: UPSELL_COMPONENT.BUTTON,
    });

    const openModalWithTelemetry = useCallback(() => {
        sendUpgradeButtonClickedEvent({
            feature,
            // buttonType,
            to: 'modal',
        });

        lumoPlusUpsellModal.openModal(true);
    }, [feature, lumoPlusUpsellModal]);

    return {
        upsellRef,
        openModal: openModalWithTelemetry,
        modalProps: lumoPlusUpsellModal.modalProps,
        renderModal: lumoPlusUpsellModal.render,
    } as const;
};

export default useLumoPlusUpgradeWithTelemetry;

// Rename to CTAModal with MeetNewCTAModal ff cleanup
import type { ComponentType } from 'react';

import { UpsellModalTypes } from '@proton/meet/types/types';
import { useFlag } from '@proton/unleash/useFlag';

import { FreeAccountModal } from './end-call/FreeAccountModal';
import { GuestAccountModal } from './end-call/GuestAccountModal';
import { HostFreeAccountModal } from './end-call/HostFreeAccountModal';
import { HostPaidAccountModal } from './end-call/HostPaidAccountModal';
import { MeetingEndedModal } from './end-call/MeetingEndedModal';
import { PaidAccountModal } from './end-call/PaidAccountModal';
import { RemovedFromMeetingModal } from './end-call/RemovedFromMeetingModal';
import type { CTAModalBaseProps } from './shared/types';
import { PersonalMeetingUpsellModal } from './upsell/PersonalMeetingUpsellModal';
import { RoomUpsellModal } from './upsell/RoomUpsellModal';
import { ScheduleUpsellModal } from './upsell/ScheduleUpsellModal';

export interface CTAModalProps extends CTAModalBaseProps {
    ctaModalType: UpsellModalTypes;
}

const MODAL_COMPONENTS: Record<UpsellModalTypes, ComponentType<CTAModalBaseProps>> = {
    [UpsellModalTypes.Schedule]: ScheduleUpsellModal,
    [UpsellModalTypes.Room]: RoomUpsellModal,
    [UpsellModalTypes.PersonalMeeting]: PersonalMeetingUpsellModal,
    [UpsellModalTypes.GuestAccount]: GuestAccountModal,
    [UpsellModalTypes.FreeAccount]: FreeAccountModal,
    [UpsellModalTypes.HostFreeAccount]: HostFreeAccountModal,
    [UpsellModalTypes.HostPaidAccount]: HostPaidAccountModal,
    [UpsellModalTypes.PaidAccount]: PaidAccountModal,
    [UpsellModalTypes.MeetingEnded]: MeetingEndedModal,
    [UpsellModalTypes.RemovedFromMeeting]: RemovedFromMeetingModal,
};

export const CTAModalNew = ({ ctaModalType, ...props }: CTAModalProps) => {
    const showUpsellModalAfterMeeting = useFlag('MeetShowUpsellModalAfterMeeting');

    if (!showUpsellModalAfterMeeting) {
        return null;
    }

    const ModalComponent = MODAL_COMPONENTS[ctaModalType];
    return <ModalComponent {...props} />;
};

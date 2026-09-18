import { startHostAccountSessionsListener } from '@proton/account/accountSessions/hostListener';
import { startAccountSessionsListener } from '@proton/account/accountSessions/listener';
import { authenticationListener } from '@proton/account/authenticationService/authenticationListener';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { groupOwnerInvitesListener } from '@proton/account/groupOwnerInvites/groupOwnerInvitesListener';
import { groupKeysListener } from '@proton/account/groups/groupKeysListener';
import { membersListener } from '@proton/account/members/membersListener';
import { unprivatizeMembersListener } from '@proton/account/members/unprivatizeMembersListener';
import { convertAddressesListener } from '@proton/account/organizationKey/convertAddressesListener';
import { organizationKeysManagementListener } from '@proton/account/organizationKey/listener';
import { resetOrganizationKeyListener } from '@proton/account/organizationKey/resetOrganizationKeyListener';
import { startPersistListener } from '@proton/account/persist/listener';
import { deviceRecoveryListener } from '@proton/account/recovery/deviceRecovery';
import { safetyReviewTelemetryListener } from '@proton/account/safetyReview/telemetry/safetyReviewTelemetryListener';
import { startListeningToPlanNameChange } from '@proton/account/subscription/startListeningToPlanNameChange';
import { startCalendarEventListener } from '@proton/calendar/calendars/listener';
import { startHolidaysDirectoryListener } from '@proton/calendar/holidaysDirectory/listener';
import { startOffersDeliveryListener } from '@proton/offers-delivery/store/listener';
import { startCalendarEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/calendarEventLoopV6';
import { startContactEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/contactEventLoopV6';
import { startCoreEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/coreEventLoopV6';
import { startMailEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/mailEventLoopV6';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { getAccountPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export const start = ({
    startListening,
    mode,
}: {
    startListening: AppStartListening;
    mode: 'public' | 'lite' | 'default';
}) => {
    if (mode === 'default') {
        startCoreEventLoopV6Listening(startListening);
        startMailEventLoopV6Listening(startListening);
        startContactEventLoopV6Listening(startListening);
        startCalendarEventLoopV6Listening(startListening);
        startSharedListening(startListening);
        deviceRecoveryListener(startListening);
        startCalendarEventListener(startListening);
        startHolidaysDirectoryListener(startListening);
        startPersistListener(startListening, getAccountPersistedState);
        organizationKeysManagementListener(startListening);
        resetOrganizationKeyListener(startListening);
        startListeningToPlanNameChange(startListening);
        startHostAccountSessionsListener(startListening);
        startAccountSessionsListener(startListening);
        convertAddressesListener(startListening);
        unprivatizeMembersListener(startListening);
        membersListener(startListening);
        groupOwnerInvitesListener(startListening);
        groupKeysListener(startListening);
        safetyReviewTelemetryListener(startListening);
        startOffersDeliveryListener(startListening, { appReady: bootstrapEvent });
    }

    if (mode === 'lite') {
        authenticationListener(startListening);
    }
};

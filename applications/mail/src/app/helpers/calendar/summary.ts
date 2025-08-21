import { c } from 'ttag';

import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getIsVeventCancelled } from '@proton/shared/lib/calendar/vcalHelper';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { InvitationModel } from './invite';
import { UPDATE_ACTION } from './invite';

export const getHasBeenUpdatedText = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, isOutdated, isFromFuture, updateAction } = model;
    const { method } = invitationIcs;

    if (isFromFuture) {
        return;
    }

    if (method === ICAL_METHOD.REPLY && invitationApi && invitationIcs.attendee?.partstat && isOutdated) {
        return c('Calendar invite info').t`This response is out of date.`;
    }

    if (
        method === ICAL_METHOD.REQUEST &&
        !isOutdated &&
        updateAction &&
        [UPDATE_ACTION.KEEP_PARTSTAT, UPDATE_ACTION.RESET_PARTSTAT].includes(updateAction)
    ) {
        return c('Calendar invite info').t`This event has been updated.`;
    }
};

export const getOrganizerSummaryText = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const {
        invitationIcs: { method, attendee: attendeeIcs, vevent: veventIcs },
        invitationApi,
        hasNoCalendars,
        hasDecryptionError,
        isOutdated,
        isFromFuture,
        isPartyCrasher,
    } = model;
    const isSingleEdit = !!veventIcs['recurrence-id'];

    if (!attendeeIcs) {
        return null;
    }

    if (method === ICAL_METHOD.REPLY) {
        if (!attendeeIcs.partstat) {
            return null;
        }

        const { partstat } = attendeeIcs;
        const participantName = attendeeIcs.displayName;

        if (!invitationApi) {
            if (hasNoCalendars) {
                return c('Calendar invite info').t`This response is out of date. You have no calendars.`;
            }

            if (hasDecryptionError) {
                // the event exists in the calendar but we couldn't decrypt it
                if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info').t`${participantName} accepted an invitation to this event.`;
                    }

                    return c('Calendar invite info').t`${participantName} accepted your invitation.`;
                }

                if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info').t`${participantName} declined an invitation to this event.`;
                    }

                    return c('Calendar invite info').t`${participantName} declined your invitation.`;
                }

                if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} tentatively accepted an invitation to this event.`;
                    }

                    return c('Calendar invite info').t`${participantName} tentatively accepted your invitation.`;
                }
            }

            return c('Calendar invite info')
                .t`This response is out of date. The event does not exist in your calendar anymore.`;
        }

        if (isFromFuture) {
            return c('Calendar invite info')
                .t`This response doesn't match your invitation details. Please verify the invitation details in your calendar.`;
        }

        if (isOutdated) {
            if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had accepted an invitation to one occurrence of the event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had previously accepted your invitation to one occurrence of the event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info').t`${participantName} had accepted an invitation to this event.`;
                }

                return c('Calendar invite info').t`${participantName} had previously accepted your invitation.`;
            }

            if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had declined an invitation to one occurrence of the event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had previously declined your invitation to one occurrence of the event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info').t`${participantName} had declined an invitation to this event.`;
                }

                return c('Calendar invite info').t`${participantName} had previously declined your invitation.`;
            }

            if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had tentatively accepted an invitation to one occurrence of the event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had previously tentatively accepted your invitation to one occurrence of the event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} had tentatively accepted an invitation to this event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} had previously tentatively accepted your invitation.`;
            }
        }

        if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
            if (isSingleEdit) {
                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} accepted an invitation to one occurrence of the event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} accepted your invitation to one occurrence of the event.`;
            }

            if (isPartyCrasher) {
                return c('Calendar invite info').t`${participantName} accepted an invitation to this event.`;
            }

            return c('Calendar invite info').t`${participantName} accepted your invitation.`;
        }

        if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
            if (isSingleEdit) {
                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} declined an invitation to one occurrence of the event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} declined your invitation to one occurrence of the event.`;
            }

            if (isPartyCrasher) {
                return c('Calendar invite info').t`${participantName} declined an invitation to this event.`;
            }

            return c('Calendar invite info').t`${participantName} declined your invitation.`;
        }

        if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
            if (isSingleEdit) {
                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} tentatively accepted an invitation to one occurrence of the event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} tentatively accepted your invitation to one occurrence of the event.`;
            }

            if (isPartyCrasher) {
                return c('Calendar invite info')
                    .t`${participantName} tentatively accepted an invitation to this event.`;
            }

            return c('Calendar invite info').t`${participantName} tentatively accepted your invitation.`;
        }
    }

    if (method === ICAL_METHOD.COUNTER) {
        // due to a scope problem with ttag (https://github.com/ttag-org/ttag-cli/issues/99),
        // we need to introduce an artificial return here
        return (() => {
            const { displayName: participantName, partstat } = attendeeIcs;

            if (!invitationApi) {
                if (hasNoCalendars) {
                    if (isSingleEdit) {
                        return c('Calendar invite info')
                            .t`${participantName} had proposed a new time for one occurrence of this event. This proposal is out of date. You have no calendars.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had proposed a new time for this event. This proposal is out of date. You have no calendars.`;
                }

                if (hasDecryptionError) {
                    // the event exists in the calendar but we couldn't decrypt it
                    if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
                        if (isSingleEdit) {
                            if (isPartyCrasher) {
                                return c('Calendar invite info')
                                    .t`${participantName} accepted an invitation and proposed a new time for one occurrence of this event.`;
                            }

                            return c('Calendar invite info')
                                .t`${participantName} accepted your invitation and proposed a new time for one occurrence of this event.`;
                        }

                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} accepted an invitation and proposed a new time for this event.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} accepted your invitation and proposed a new time for this event.`;
                    }

                    if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
                        if (isSingleEdit) {
                            if (isPartyCrasher) {
                                return c('Calendar invite info')
                                    .t`${participantName} declined an invitation and proposed a new time for one occurrence of this event.`;
                            }

                            return c('Calendar invite info')
                                .t`${participantName} declined your invitation and proposed a new time for one occurrence of this event.`;
                        }

                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} declined an invitation and proposed a new time for this event.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} declined your invitation and proposed a new time for this event.`;
                    }

                    if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
                        if (isSingleEdit) {
                            if (isPartyCrasher) {
                                return c('Calendar invite info')
                                    .t`${participantName} tentatively accepted an invitation and proposed a new time for one occurrence of this event.`;
                            }

                            return c('Calendar invite info')
                                .t`${participantName} tentatively accepted your invitation and proposed a new time for one occurrence of this event.`;
                        }

                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} tentatively accepted an invitation and proposed a new time for this event.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} tentatively accepted your invitation and proposed a new time for this event.`;
                    }

                    if (isSingleEdit) {
                        return c('Calendar invite info')
                            .t`${participantName} proposed a new time for one occurrence of this event.`;
                    }

                    return c('Calendar invite info').t`${participantName} proposed a new time for this event.`;
                }

                if (isSingleEdit) {
                    return c('Calendar invite info')
                        .t`${participantName} had proposed a new time for one occurrence of this event. This proposal is out of date. The event does not exist in your calendar anymore.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} had proposed a new time for this event. This proposal is out of date. The event does not exist in your calendar anymore.`;
            }

            if (isFromFuture) {
                return c('Calendar invite info')
                    .t`This new time proposal doesn't match your invitation details. Please verify the invitation details in your calendar.`;
            }

            if (isOutdated) {
                if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
                    if (isSingleEdit) {
                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} had accepted an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} had accepted your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                    }

                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had accepted an invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had accepted your invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                }

                if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
                    if (isSingleEdit) {
                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} had declined an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} had declined your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                    }
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had declined an invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had declined your invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                }

                if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
                    if (isSingleEdit) {
                        if (isPartyCrasher) {
                            return c('Calendar invite info')
                                .t`${participantName} had tentatively accepted an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                        }

                        return c('Calendar invite info')
                            .t`${participantName} had tentatively accepted your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date.`;
                    }
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} had tentatively accepted an invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} had tentatively accepted your invitation and proposed a new time for this event. Answer and proposal are out of date.`;
                }

                if (isSingleEdit) {
                    return c('Calendar invite info')
                        .t`${participantName} had proposed a new time for one occurrence of this event. This proposal is out of date.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} had proposed a new time for this event. This proposal is out of date.`;
            }

            if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} accepted an invitation and proposed a new time for one occurrence of this event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} accepted your invitation and proposed a new time for one occurrence of this event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} accepted an invitation and proposed a new time for this event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} accepted your invitation and proposed a new time for this event.`;
            }

            if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} declined an invitation and proposed a new time for one occurrence of this event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} declined your invitation and proposed a new time for one occurrence of this event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} declined an invitation and proposed a new time for this event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} declined your invitation and proposed a new time for this event.`;
            }

            if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
                if (isSingleEdit) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info')
                            .t`${participantName} tentatively accepted an invitation and proposed a new time for one occurrence of this event.`;
                    }

                    return c('Calendar invite info')
                        .t`${participantName} tentatively accepted your invitation and proposed a new time for one occurrence of this event.`;
                }

                if (isPartyCrasher) {
                    return c('Calendar invite info')
                        .t`${participantName} tentatively accepted an invitation and proposed a new time for this event.`;
                }

                return c('Calendar invite info')
                    .t`${participantName} tentatively accepted your invitation and proposed a new time for this event.`;
            }

            if (isSingleEdit) {
                return c('Calendar invite info')
                    .t`${participantName} proposed a new time for one occurrence of this event.`;
            }

            return c('Calendar invite info').t`${participantName} proposed a new time for this event.`;
        })();
    }

    if (method === ICAL_METHOD.REFRESH) {
        // due to a scope problem with ttag (https://github.com/ttag-org/ttag-cli/issues/99),
        // we need to introduce an artificial return here
        return (() => {
            const { displayName: participantName } = attendeeIcs;
            const genericMessage = c('Calendar invite info').t`${participantName} asked for the latest event updates.`;

            if (!invitationApi) {
                if (hasNoCalendars) {
                    return c('Calendar invite info')
                        .t`${participantName} asked for the latest updates to an event which does not exist anymore. You have no calendars.`;
                }

                if (hasDecryptionError) {
                    // the event exists in the calendar but we couldn't decrypt it
                    return genericMessage;
                }

                return c('Calendar invite info')
                    .t`${participantName} asked for the latest updates to an event which does not exist in your calendar anymore.`;
            }

            if (isFromFuture) {
                return c('Calendar invite info')
                    .t`${participantName} asked for the latest updates to an event which doesn't match your invitation details. Please verify the invitation details in your calendar.`;
            }

            return genericMessage;
        })();
    }
};

export const getAttendeeSummaryText = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, isOutdated } = model;
    const { method, attendee: attendeeIcs } = invitationIcs;
    const { vevent: veventApi, attendee: attendeeApi } = invitationApi || {};

    if (method === ICAL_METHOD.REQUEST) {
        if (!veventApi) {
            return null;
        }
        if (isOutdated) {
            if (getIsVeventCancelled(veventApi)) {
                return c('Calendar invite info').t`This invitation is out of date. The event has been canceled.`;
            }

            return c('Calendar invite info').t`This invitation is out of date. The event has been updated.`;
        }

        const partstat = (attendeeApi || attendeeIcs)?.partstat;

        if (!partstat) {
            return null;
        }

        if (partstat === ICAL_ATTENDEE_STATUS.ACCEPTED) {
            return c('Calendar invite info').t`You already accepted this invitation.`;
        }

        if (partstat === ICAL_ATTENDEE_STATUS.TENTATIVE) {
            return c('Calendar invite info').t`You already tentatively accepted this invitation.`;
        }

        if (partstat === ICAL_ATTENDEE_STATUS.DECLINED) {
            return c('Calendar invite info').t`You already declined this invitation.`;
        }
    }

    if (method === ICAL_METHOD.CANCEL) {
        return c('Calendar invite info').t`This event has been canceled.`;
    }

    if (method === ICAL_METHOD.ADD) {
        if (!veventApi) {
            return c('Calendar invite info').t`This invitation is out of date. The event has been deleted.`;
        }

        if (isOutdated) {
            if (getIsVeventCancelled(veventApi)) {
                return c('Calendar invite info').t`This invitation is out of date. The event has been canceled.`;
            }

            return c('Calendar invite info').t`This invitation is out of date. The event has been updated.`;
        }

        // Adding occurrences is not supported for the moment. When we do we can recover the text
        // return c('Calendar invite info').t`An occurrence has been added to the event ${veventIcsTitle}`;
        return null;
    }
};

import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { getDisplayTitle } from '@proton/shared/lib/calendar/helper';
import { getEventStatus } from '@proton/shared/lib/calendar/vcalHelper';
import { c } from 'ttag';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { InvitationModel, UPDATE_ACTION } from './invite';

const { REPLY, COUNTER, REFRESH, REQUEST, CANCEL, ADD } = ICAL_METHOD;
const { NEEDS_ACTION, ACCEPTED, TENTATIVE, DECLINED } = ICAL_ATTENDEE_STATUS;
const { CANCELLED } = ICAL_EVENT_STATUS;
const { KEEP_PARTSTAT, RESET_PARTSTAT } = UPDATE_ACTION;

export const getHasBeenUpdatedText = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, isOutdated, isFromFuture, updateAction } = model;
    const { method } = invitationIcs;

    if (isFromFuture) {
        return;
    }
    if (method === REPLY && invitationApi && invitationIcs.attendee?.partstat && isOutdated) {
        return c('Calendar invite info').t`This response is out of date. This event has been updated.`;
    }

    if (method === REQUEST && !isOutdated && updateAction && [KEEP_PARTSTAT, RESET_PARTSTAT].includes(updateAction)) {
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

    if (method === REPLY) {
        if (!attendeeIcs?.partstat) {
            return;
        }
        const { partstat } = attendeeIcs;
        const participantName = attendeeIcs.displayName;

        if (!invitationApi) {
            if (hasNoCalendars) {
                return c('Calendar invite info').t`This response is out of date. You have no calendars.`;
            }
            if (hasDecryptionError) {
                // the event exists in the calendar but we couldn't decrypt it
                if (partstat === ACCEPTED) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info').t`${participantName} accepted an invitation to this event.`;
                    }
                    return c('Calendar invite info').t`${participantName} accepted your invitation.`;
                }
                if (partstat === DECLINED) {
                    if (isPartyCrasher) {
                        return c('Calendar invite info').t`${participantName} declined an invitation to this event.`;
                    }
                    return c('Calendar invite info').t`${participantName} declined your invitation.`;
                }
                if (partstat === TENTATIVE) {
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
                .t` This response doesn't match your invitation details. Please verify the invitation details in your calendar.`;
        }

        if (isOutdated) {
            if (partstat === ACCEPTED) {
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
            if (partstat === DECLINED) {
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
            if (partstat === TENTATIVE) {
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

        if (partstat === ACCEPTED) {
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
        if (partstat === DECLINED) {
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
        if (partstat === TENTATIVE) {
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

    if (method === COUNTER && attendeeIcs) {
        // due to a scope problem with ttag (https://github.com/ttag-org/ttag-cli/issues/99),
        // we need to introduce an artificial return here
        return (() => {
            const { displayName: participantName, partstat } = attendeeIcs;
            const hasAlsoReplied = partstat && [ACCEPTED, TENTATIVE, DECLINED].includes(partstat);
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
                    if (hasAlsoReplied) {
                        if (partstat === ACCEPTED) {
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
                        if (partstat === DECLINED) {
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
                        if (partstat === TENTATIVE) {
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
                    .t` This new time proposal doesn't match your invitation details. Please verify the invitation details in your calendar.`;
            }
            if (isOutdated) {
                if (hasAlsoReplied) {
                    if (partstat === ACCEPTED) {
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
                    if (partstat === DECLINED) {
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
                    if (partstat === TENTATIVE) {
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
                }
                if (isSingleEdit) {
                    return c('Calendar invite info')
                        .t`${participantName} had proposed a new time for one occurrence of this event. This proposal is out of date.`;
                }
                return c('Calendar invite info')
                    .t`${participantName} had proposed a new time for this event. This proposal is out of date.`;
            }
            if (hasAlsoReplied) {
                if (partstat === ACCEPTED) {
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
                if (partstat === DECLINED) {
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
                if (partstat === TENTATIVE) {
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
            }
            if (isSingleEdit) {
                return c('Calendar invite info')
                    .t`${participantName} proposed a new time for one occurrence of this event.`;
            }
            return c('Calendar invite info').t`${participantName} proposed a new time for this event.`;
        })();
    }

    if (method === REFRESH && attendeeIcs) {
        // due to a scope problem with ttag (https://github.com/ttag-org/ttag-cli/issues/99),
        // we need to introduce an artificial return here
        return (() => {
            const { displayName: participantName } = attendeeIcs;
            if (!invitationApi) {
                if (hasNoCalendars) {
                    return c('Calendar invite info')
                        .t`${participantName} asked for the latest updates to an event which does not exist anymore. You have no calendars.`;
                }
                if (hasDecryptionError) {
                    // the event exists in the calendar but we couldn't decrypt it
                    if (isPartyCrasher) {
                        return c('Calendar invite info').t`${participantName} asked for the latest event updates.`;
                    }
                    return c('Calendar invite info').t`${participantName} asked for the latest event updates.`;
                }
                return c('Calendar invite info')
                    .t`${participantName} asked for the latest updates to an event which does not exist in your calendar anymore.`;
            }
            if (isPartyCrasher) {
                return c('Calendar invite info').t`${participantName} asked for the latest event updates.`;
            }
            return c('Calendar invite info').t`${participantName} asked for the latest event updates.`;
        })();
    }
};

export const getAttendeeSummaryText = (model: RequireSome<InvitationModel, 'invitationIcs'>) => {
    const { invitationIcs, invitationApi, isOutdated } = model;
    const { method, attendee: attendeeIcs, vevent: veventIcs } = invitationIcs;
    const { vevent: veventApi, attendee: attendeeApi } = invitationApi || {};
    const veventIcsTitle = getDisplayTitle(veventIcs.summary?.value);

    if (method === REQUEST) {
        if (isOutdated) {
            if (veventApi && getEventStatus(veventApi) === CANCELLED) {
                return c('Calendar invite info').t`This invitation is out of date. The event has been canceled.`;
            }
            return c('Calendar invite info').t`This invitation is out of date. The event has been updated.`;
        }

        const attendee = attendeeApi || attendeeIcs;
        // force unanswered partstat if the event is not in the db
        const partstat = !veventApi ? NEEDS_ACTION : attendee?.partstat || NEEDS_ACTION;

        if (partstat === ACCEPTED) {
            return c('Calendar invite info').t`You already accepted this invitation.`;
        }
        if (partstat === TENTATIVE) {
            return c('Calendar invite info').t`You already tentatively accepted this invitation.`;
        }
        if (partstat === DECLINED) {
            return c('Calendar invite info').t`You already declined this invitation.`;
        }
    }

    if (method === CANCEL) {
        return c('Calendar invite info').t`This event has been canceled.`;
    }

    if (method === ADD) {
        if (!veventApi) {
            return c('Calendar invite info').t`This invitation is out of date. The event has been deleted.`;
        }
        if (isOutdated) {
            if (getEventStatus(veventApi) === CANCELLED) {
                return c('Calendar invite info').t`This invitation is out of date. The event has been canceled.`;
            }
            return c('Calendar invite info').t`This invitation is out of date. The event has been updated.`;
        }
        return c('Calendar invite info').t`An occurrence has been added to the event ${veventIcsTitle}`;
    }
};

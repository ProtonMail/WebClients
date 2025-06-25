import { render, screen } from '@testing-library/react';

import { ICAL_ATTENDEE_STATUS, ICAL_EVENT_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import type { Participant, VcalDateProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { calendarEventBuilder, veventBuilder } from '@proton/testing';

import type { InvitationModel } from '../../../../../helpers/calendar/invite';
import { EVENT_TIME_STATUS, UPDATE_ACTION } from '../../../../../helpers/calendar/invite';
import ExtraEventSummary from './ExtraEventSummary';

const dummyRecurrenceID: VcalDateProperty = {
    value: {
        year: 2020,
        month: 2,
        day: 2,
    },
    parameters: {
        type: 'date',
    },
};

const getAttendee = (partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION) => ({
    vcalComponent: { value: 'test@pm.gg' },
    name: 'test',
    emailAddress: 'test@pm.gg',
    displayName: 'test',
    displayEmail: 'test@pm.gg',
    partstat,
});

function renderComponent({
    vevent,
    method = ICAL_METHOD.REPLY,
    attendee,
    props,
}: {
    vevent?: Partial<VcalVeventComponent>;
    attendee?: Participant;
    method?: ICAL_METHOD;
    props?: Partial<InvitationModel>;
}) {
    const model = {
        isImport: false,
        isOrganizerMode: false,
        hasMultipleVevents: false,
        hasProtonUID: true,
        timeStatus: EVENT_TIME_STATUS.FUTURE,
        isAddressActive: true,
        isAddressDisabled: false,
        canCreateCalendar: true,
        maxUserCalendarsDisabled: false,
        hasNoCalendars: false,
        hideSummary: false,
        invitationIcs: {
            vevent: {
                component: 'vevent' as const,
                uid: { value: 'uid' },
                dtstamp: {
                    value: {
                        year: 2020,
                        month: 2,
                        day: 2,
                        hours: 2,
                        minutes: 2,
                        seconds: 2,
                        isUTC: true,
                    },
                },
                dtstart: {
                    value: {
                        year: 2020,
                        month: 2,
                        day: 2,
                        hours: 2,
                        minutes: 2,
                        seconds: 2,
                        isUTC: true,
                    },
                },
                attendee: [{ value: 'test@pm.gg' }],
                ...vevent,
            },
            method,
            attendee,
        },
        ...props,
    };

    return render(<ExtraEventSummary model={model} />);
}

describe('ExtraEventSummary', () => {
    it('displays nothing when importing', () => {
        const { container } = renderComponent({
            props: { isImport: true },
            attendee: getAttendee(),
        });

        expect(container).toBeEmptyDOMElement();
    });

    it('displays nothing when hideSummary is set', () => {
        const { container } = renderComponent({
            props: { hideSummary: true },
            attendee: getAttendee(),
        });

        expect(container).toBeEmptyDOMElement();
    });

    describe('Attendee mode', () => {
        describe('method: request', () => {
            describe('outdated event', () => {
                it('displays nothing when there is no event from api', () => {
                    const { container } = renderComponent({
                        props: { isOutdated: true },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.REQUEST,
                    });

                    expect(container).toBeEmptyDOMElement();
                });

                it('displays a cancellation message when the status is canceled', () => {
                    renderComponent({
                        props: {
                            isOutdated: true,
                            invitationApi: {
                                vevent: veventBuilder({
                                    overrides: { status: { value: ICAL_EVENT_STATUS.CANCELLED } },
                                }),
                                calendarEvent: calendarEventBuilder(),
                            },
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.REQUEST,
                    });

                    expect(
                        screen.getByText(/This invitation is out of date. The event has been canceled./)
                    ).toBeInTheDocument();
                });

                it('displays an out of date message when the event is out of date', () => {
                    renderComponent({
                        props: {
                            isOutdated: true,
                            invitationApi: {
                                vevent: veventBuilder(),
                                calendarEvent: calendarEventBuilder(),
                            },
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.REQUEST,
                    });

                    expect(
                        screen.getByText(/This invitation is out of date. The event has been updated./)
                    ).toBeInTheDocument();
                });
            });

            describe('has been updated text', () => {
                it('displays the updated text for partstat keep update action', () => {
                    renderComponent({
                        props: {
                            updateAction: UPDATE_ACTION.KEEP_PARTSTAT,
                            invitationApi: {
                                vevent: veventBuilder(),
                                calendarEvent: calendarEventBuilder(),
                            },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        method: ICAL_METHOD.REQUEST,
                    });

                    expect(screen.getByText(/This event has been updated./)).toBeInTheDocument();
                });

                it('displays the updated text for partstat reset update action', () => {
                    renderComponent({
                        props: {
                            updateAction: UPDATE_ACTION.RESET_PARTSTAT,
                            invitationApi: {
                                vevent: veventBuilder(),
                                calendarEvent: calendarEventBuilder(),
                            },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        method: ICAL_METHOD.REQUEST,
                    });

                    expect(screen.getByText(/This event has been updated./)).toBeInTheDocument();
                });
            });

            it('displays nothing when there is no event from api', () => {
                const { container } = renderComponent({
                    attendee: getAttendee(),
                    method: ICAL_METHOD.REQUEST,
                });

                expect(container).toBeEmptyDOMElement();
            });

            it('displays nothing when the partstat is "needs action"', () => {
                const { container } = renderComponent({
                    props: {
                        invitationApi: {
                            vevent: veventBuilder(),
                            calendarEvent: calendarEventBuilder(),
                        },
                    },
                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.NEEDS_ACTION),
                    method: ICAL_METHOD.REQUEST,
                });

                expect(container).toBeEmptyDOMElement();
            });

            it('displays accepted message when the partstat is accepted', () => {
                renderComponent({
                    props: {
                        invitationApi: {
                            vevent: veventBuilder(),
                            calendarEvent: calendarEventBuilder(),
                        },
                    },
                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                    method: ICAL_METHOD.REQUEST,
                });

                expect(screen.getByText(/You already accepted this invitation./)).toBeInTheDocument();
            });

            it('displays declined message when the partstat is declined', () => {
                renderComponent({
                    props: {
                        invitationApi: {
                            vevent: veventBuilder(),
                            calendarEvent: calendarEventBuilder(),
                        },
                    },
                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                    method: ICAL_METHOD.REQUEST,
                });

                expect(screen.getByText(/You already declined this invitation./)).toBeInTheDocument();
            });

            it('displays tentatively accepted message when the partstat is tentatively accepted', () => {
                renderComponent({
                    props: {
                        invitationApi: {
                            vevent: veventBuilder(),
                            calendarEvent: calendarEventBuilder(),
                        },
                    },
                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                    method: ICAL_METHOD.REQUEST,
                });

                expect(screen.getByText(/You already tentatively accepted this invitation./)).toBeInTheDocument();
            });
        });

        describe('method: cancel', () => {
            it('displays the canceled message when the method is cancel', () => {
                renderComponent({
                    attendee: getAttendee(),
                    method: ICAL_METHOD.CANCEL,
                });

                expect(screen.getByText(/This event has been canceled./)).toBeInTheDocument();
            });
        });

        describe('method: add', () => {
            it('displays the out of date message when there is no vevent from api', () => {
                renderComponent({
                    attendee: getAttendee(),
                    method: ICAL_METHOD.ADD,
                });

                expect(
                    screen.getByText(/This invitation is out of date. The event has been deleted./)
                ).toBeInTheDocument();
            });

            it('displays the deletion message when there is no vevent from api', () => {
                renderComponent({
                    attendee: getAttendee(),
                    method: ICAL_METHOD.ADD,
                });

                expect(
                    screen.getByText(/This invitation is out of date. The event has been deleted./)
                ).toBeInTheDocument();
            });

            describe('outdated event', () => {
                it('displays the cancellation message when the outdated event has a canceled status', () => {
                    renderComponent({
                        props: {
                            invitationApi: {
                                vevent: veventBuilder({
                                    overrides: { status: { value: ICAL_EVENT_STATUS.CANCELLED } },
                                }),
                                calendarEvent: calendarEventBuilder(),
                            },
                            isOutdated: true,
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.ADD,
                    });

                    expect(
                        screen.getByText(/This invitation is out of date. The event has been canceled./)
                    ).toBeInTheDocument();
                });

                it('displays the outdated message when the invitation is outdated', () => {
                    renderComponent({
                        props: {
                            invitationApi: {
                                vevent: veventBuilder(),
                                calendarEvent: calendarEventBuilder(),
                            },
                            isOutdated: true,
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.ADD,
                    });

                    expect(
                        screen.getByText(/This invitation is out of date. The event has been updated./)
                    ).toBeInTheDocument();
                });
            });

            it('does not display the occurrence added message when the event is not outdated and is available from the API', () => {
                renderComponent({
                    props: {
                        invitationApi: {
                            vevent: veventBuilder(),
                            calendarEvent: calendarEventBuilder(),
                        },
                    },
                    attendee: getAttendee(),
                    method: ICAL_METHOD.ADD,
                });

                expect(
                    screen.queryByText(/An occurrence has been added to the event \(no title\)/)
                ).not.toBeInTheDocument();
            });
        });
    });

    describe('Organizer mode', () => {
        it('displays nothing when there are no attendees', () => {
            const { container } = renderComponent({
                props: { isOrganizerMode: true },
            });

            expect(container).toBeEmptyDOMElement();
        });

        describe('method: reply', () => {
            it('displays nothing when the attendee has no partstat', () => {
                const attendee = getAttendee();

                // If somehow the attendee doesn't have a partstat
                // @ts-ignore
                delete attendee.partstat;

                const { container } = renderComponent({
                    props: { isOrganizerMode: true },
                    attendee,
                });

                expect(container).toBeEmptyDOMElement();
            });

            describe('no event from api', () => {
                it('displays the no calendars message when there are no calendars', () => {
                    renderComponent({
                        props: { isOrganizerMode: true, hasNoCalendars: true },
                        attendee: getAttendee(),
                    });

                    expect(
                        screen.getByText(/This response is out of date. You have no calendars./)
                    ).toBeInTheDocument();
                });

                describe('decryption error', () => {
                    describe('partstat: accepted', () => {
                        it('displays the accepted message when the event was accepted', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            });

                            expect(screen.getByText(/test accepted your invitation./)).toBeInTheDocument();
                        });

                        it('displays the partycrasher accepted message when the event was accepted', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true, isPartyCrasher: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            });

                            expect(screen.getByText(/test accepted an invitation to this event./)).toBeInTheDocument();
                        });
                    });

                    describe('partstat: declined', () => {
                        it('displays the declined message when the event was declined', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            });

                            expect(screen.getByText(/test declined your invitation./)).toBeInTheDocument();
                        });

                        it('displays the partycrasher declined message when the event was declined', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true, isPartyCrasher: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            });

                            expect(screen.getByText(/test declined an invitation to this event./)).toBeInTheDocument();
                        });
                    });

                    describe('partstat: tentative', () => {
                        it('displays the tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            });

                            expect(screen.getByText(/test tentatively accepted your invitation./)).toBeInTheDocument();
                        });

                        it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: { isOrganizerMode: true, hasDecryptionError: true, isPartyCrasher: true },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            });

                            expect(
                                screen.getByText(/test tentatively accepted an invitation to this event./)
                            ).toBeInTheDocument();
                        });
                    });
                });

                it('displays the does not exist message when the event does not exist', () => {
                    renderComponent({ props: { isOrganizerMode: true }, attendee: getAttendee() });

                    expect(
                        screen.getByText(
                            /This response is out of date. The event does not exist in your calendar anymore./
                        )
                    ).toBeInTheDocument();
                });
            });

            it('displays the future event message when the event is in the future', () => {
                renderComponent({
                    props: {
                        isOrganizerMode: true,
                        isFromFuture: true,
                        invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                    },
                    attendee: getAttendee(),
                });

                expect(
                    screen.getByText(
                        /This response doesn't match your invitation details. Please verify the invitation details in your calendar./
                    )
                ).toBeInTheDocument();
            });

            describe('outdated event', () => {
                describe('partstat: accepted', () => {
                    describe('single edit', () => {
                        it('displays the accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            });

                            expect(
                                screen.getByText(
                                    /test had previously accepted your invitation to one occurrence of the event./
                                )
                            ).toBeInTheDocument();

                            // has been updated text
                            expect(screen.getByText(/This response is out of date./)).toBeInTheDocument();
                        });

                        it('displays the partycrasher accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            });

                            expect(
                                screen.getByText(/test had accepted an invitation to one occurrence of the event./)
                            ).toBeInTheDocument();
                        });
                    });

                    it('displays the accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        });

                        expect(screen.getByText(/test had previously accepted your invitation./)).toBeInTheDocument();
                    });

                    it('displays the partycrasher accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        });

                        expect(screen.getByText(/test had accepted an invitation to this event./)).toBeInTheDocument();
                    });
                });

                describe('partstat: declined', () => {
                    describe('single edit', () => {
                        it('displays the declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            });

                            expect(
                                screen.getByText(
                                    /test had previously declined your invitation to one occurrence of the event./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            });

                            expect(
                                screen.getByText(/test had declined an invitation to one occurrence of the event./)
                            ).toBeInTheDocument();
                        });
                    });

                    it('displays the declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        });

                        expect(screen.getByText(/test had previously declined your invitation./)).toBeInTheDocument();
                    });

                    it('displays the partycrasher declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        });

                        expect(screen.getByText(/test had declined an invitation to this event./)).toBeInTheDocument();
                    });
                });

                describe('partstat: tentative', () => {
                    describe('single edit', () => {
                        it('displays the tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            });

                            expect(
                                screen.getByText(
                                    /test had previously tentatively accepted your invitation to one occurrence of the event./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            });

                            expect(
                                screen.getByText(
                                    /test had tentatively accepted an invitation to one occurrence of the event./
                                )
                            ).toBeInTheDocument();
                        });
                    });
                    it('displays the tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        });

                        expect(
                            screen.getByText(/test had previously tentatively accepted your invitation./)
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        });

                        expect(
                            screen.getByText(/test had tentatively accepted an invitation to this event./)
                        ).toBeInTheDocument();
                    });
                });
            });

            describe('partstat: accepted', () => {
                describe('single edit', () => {
                    it('displays the accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        });

                        expect(
                            screen.getByText(/test accepted your invitation to one occurrence of the event./)
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        });

                        expect(
                            screen.getByText(/test accepted an invitation to one occurrence of the event./)
                        ).toBeInTheDocument();
                    });
                });

                it('displays the accepted message when the event was accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                    });

                    expect(screen.getByText(/test accepted your invitation./)).toBeInTheDocument();
                });

                it('displays the partycrasher accepted message when the event was accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                    });

                    expect(screen.getByText(/test accepted an invitation to this event./)).toBeInTheDocument();
                });
            });

            describe('partstat: declined', () => {
                describe('single edit', () => {
                    it('displays the declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        });

                        expect(
                            screen.getByText(/test declined your invitation to one occurrence of the event./)
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        });

                        expect(
                            screen.getByText(/test declined an invitation to one occurrence of the event./)
                        ).toBeInTheDocument();
                    });
                });

                it('displays the declined message when the event was declined', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                    });

                    expect(screen.getByText(/test declined your invitation./)).toBeInTheDocument();
                });

                it('displays the partycrasher declined message when the event was declined', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                    });

                    expect(screen.getByText(/test declined an invitation to this event./)).toBeInTheDocument();
                });
            });

            describe('partstat: tentative', () => {
                describe('single edit', () => {
                    it('displays the tentatively accepted message when the event was tentatively accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        });

                        expect(
                            screen.getByText(
                                /test tentatively accepted your invitation to one occurrence of the event./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher tentatively accepted message when the event was tentatively accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        });

                        expect(
                            screen.getByText(/test tentatively accepted an invitation to one occurrence of the event./)
                        ).toBeInTheDocument();
                    });
                });

                it('displays the tentatively accepted message when the event was tentatively accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                    });

                    expect(screen.getByText(/test tentatively accepted your invitation./)).toBeInTheDocument();
                });

                it('displays the partycrasher tentatively accepted message when the event was tentatively accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                    });

                    expect(
                        screen.getByText(/test tentatively accepted an invitation to this event./)
                    ).toBeInTheDocument();
                });
            });
        });

        describe('method: counter', () => {
            describe('no event from api', () => {
                it('single edit: displays the no calendars message when there are no calendars', () => {
                    renderComponent({
                        props: { isOrganizerMode: true, hasNoCalendars: true },
                        attendee: getAttendee(),
                        vevent: { 'recurrence-id': dummyRecurrenceID },
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test had proposed a new time for one occurrence of this event. This proposal is out of date. You have no calendars./
                        )
                    ).toBeInTheDocument();
                });

                it('displays the no calendars message when there are no calendars', () => {
                    renderComponent({
                        props: { isOrganizerMode: true, hasNoCalendars: true },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test had proposed a new time for this event. This proposal is out of date. You have no calendars./
                        )
                    ).toBeInTheDocument();
                });

                describe('has decryption error', () => {
                    describe('partstat: accepted', () => {
                        describe('single edit', () => {
                            it('displays the accepted message when the event was accepted', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test accepted your invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });

                            it('displays the partycrasher accepted message when the event was accepted', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                        isPartyCrasher: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test accepted an invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });
                        });

                        it('displays the accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test accepted your invitation and proposed a new time for this event./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                    isPartyCrasher: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(/test accepted an invitation and proposed a new time for this event./)
                            ).toBeInTheDocument();
                        });
                    });

                    describe('partstat: declined', () => {
                        describe('single edit', () => {
                            it('displays the declined message when the event was declined', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test declined your invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });

                            it('displays the partycrasher declined message when the event was declined', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                        isPartyCrasher: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test declined an invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });
                        });

                        it('displays the declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test declined your invitation and proposed a new time for this event./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                    isPartyCrasher: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(/test declined an invitation and proposed a new time for this event./)
                            ).toBeInTheDocument();
                        });
                    });

                    describe('partstat: tentative', () => {
                        describe('single edit', () => {
                            it('displays the tentative message when the event was accepted tentatively', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test tentatively accepted your invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });

                            it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                                renderComponent({
                                    props: {
                                        hasDecryptionError: true,
                                        isOrganizerMode: true,
                                        isPartyCrasher: true,
                                    },
                                    vevent: { 'recurrence-id': dummyRecurrenceID },
                                    attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                    method: ICAL_METHOD.COUNTER,
                                });

                                expect(
                                    screen.getByText(
                                        /test tentatively accepted an invitation and proposed a new time for one occurrence of this event./
                                    )
                                ).toBeInTheDocument();
                            });
                        });

                        it('displays the tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test tentatively accepted your invitation and proposed a new time for this event./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    hasDecryptionError: true,
                                    isOrganizerMode: true,
                                    isPartyCrasher: true,
                                },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test tentatively accepted an invitation and proposed a new time for this event./
                                )
                            ).toBeInTheDocument();
                        });
                    });

                    it('single edit: displays the out of date message when there are out of date', () => {
                        renderComponent({
                            props: { isOrganizerMode: true, hasDecryptionError: true },
                            attendee: getAttendee(),
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(/test proposed a new time for one occurrence of this event./)
                        ).toBeInTheDocument();
                    });

                    it('displays the out of date message when there are out of date', () => {
                        renderComponent({
                            props: { isOrganizerMode: true, hasDecryptionError: true },
                            attendee: getAttendee(),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(screen.getByText(/test proposed a new time for this event./)).toBeInTheDocument();
                    });
                });

                it('single edit: displays the out of date message when there are out of date', () => {
                    renderComponent({
                        props: { isOrganizerMode: true },
                        attendee: getAttendee(),
                        vevent: { 'recurrence-id': dummyRecurrenceID },
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test had proposed a new time for one occurrence of this event. This proposal is out of date. The event does not exist in your calendar anymore./
                        )
                    ).toBeInTheDocument();
                });

                it('displays the out of date message when there are out of date', () => {
                    renderComponent({
                        props: { isOrganizerMode: true },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test had proposed a new time for this event. This proposal is out of date. The event does not exist in your calendar anymore./
                        )
                    ).toBeInTheDocument();
                });
            });

            it('displays the future event message when the event is in the future', () => {
                const { container } = renderComponent({
                    props: {
                        isOrganizerMode: true,
                        isFromFuture: true,
                        invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                    },
                    method: ICAL_METHOD.COUNTER,
                    attendee: getAttendee(),
                });

                expect(container.children[0].children.length).toBe(1);

                expect(
                    screen.getByText(
                        /This new time proposal doesn't match your invitation details. Please verify the invitation details in your calendar./
                    )
                ).toBeInTheDocument();
            });

            describe('outdated event', () => {
                describe('partstat: accepted', () => {
                    describe('single edit', () => {
                        it('displays the accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had accepted your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher accepted message when the event was accepted', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had accepted an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });
                    });

                    it('displays the accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had accepted your invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had accepted an invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });
                });

                describe('partstat: declined', () => {
                    describe('single edit', () => {
                        it('displays the declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had declined your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher declined message when the event was declined', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had declined an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });
                    });

                    it('displays the declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had declined your invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had declined an invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });
                });

                describe('partstat: tentative', () => {
                    describe('single edit', () => {
                        it('displays the tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had tentatively accepted your invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });

                        it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                            renderComponent({
                                props: {
                                    isOrganizerMode: true,
                                    invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                    isOutdated: true,
                                    isPartyCrasher: true,
                                },
                                vevent: { 'recurrence-id': dummyRecurrenceID },
                                attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                                method: ICAL_METHOD.COUNTER,
                            });

                            expect(
                                screen.getByText(
                                    /test had tentatively accepted an invitation and proposed a new time for one occurrence of this event. Answer and proposal are out of date./
                                )
                            ).toBeInTheDocument();
                        });
                    });
                    it('displays the tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had tentatively accepted your invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                                isPartyCrasher: true,
                            },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had tentatively accepted an invitation and proposed a new time for this event. Answer and proposal are out of date./
                            )
                        ).toBeInTheDocument();
                    });
                });

                describe('single edit', () => {
                    it('displays the correct message when a counter was proposed', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isOutdated: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test had proposed a new time for one occurrence of this event. This proposal is out of date./
                            )
                        ).toBeInTheDocument();
                    });
                });

                it('displays the correct message when a counter was proposed', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isOutdated: true,
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test had proposed a new time for this event. This proposal is out of date./)
                    ).toBeInTheDocument();
                });
            });

            describe('partstat: accepted', () => {
                describe('single edit', () => {
                    it('displays the accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test accepted your invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher accepted message when the event was accepted', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test accepted an invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });
                });

                it('displays the accepted message when the event was accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test accepted your invitation and proposed a new time for this event./)
                    ).toBeInTheDocument();
                });

                it('displays the partycrasher accepted message when the event was accepted', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test accepted an invitation and proposed a new time for this event./)
                    ).toBeInTheDocument();
                });
            });

            describe('partstat: declined', () => {
                describe('single edit', () => {
                    it('displays the declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test declined your invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher declined message when the event was declined', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test declined an invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });
                });

                it('displays the declined message when the event was declined', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test declined your invitation and proposed a new time for this event./)
                    ).toBeInTheDocument();
                });

                it('displays the partycrasher declined message when the event was declined', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.DECLINED),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test declined an invitation and proposed a new time for this event./)
                    ).toBeInTheDocument();
                });
            });

            describe('partstat: tentative', () => {
                describe('single edit', () => {
                    it('displays the tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test tentatively accepted your invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });

                    it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                        renderComponent({
                            props: {
                                isOrganizerMode: true,
                                invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                                isPartyCrasher: true,
                            },
                            vevent: { 'recurrence-id': dummyRecurrenceID },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                            method: ICAL_METHOD.COUNTER,
                        });

                        expect(
                            screen.getByText(
                                /test tentatively accepted an invitation and proposed a new time for one occurrence of this event./
                            )
                        ).toBeInTheDocument();
                    });
                });

                it('displays the tentative message when the event was accepted tentatively', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test tentatively accepted your invitation and proposed a new time for this event./
                        )
                    ).toBeInTheDocument();
                });

                it('displays the partycrasher tentative message when the event was accepted tentatively', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                            isPartyCrasher: true,
                        },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.TENTATIVE),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(
                            /test tentatively accepted an invitation and proposed a new time for this event./
                        )
                    ).toBeInTheDocument();
                });

                it('single edit: displays the out of date message when there are out of date', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(),
                        vevent: { 'recurrence-id': dummyRecurrenceID },
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test proposed a new time for one occurrence of this event./)
                    ).toBeInTheDocument();
                });

                it('displays the out of date message when there are out of date', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(screen.getByText(/test proposed a new time for this event./)).toBeInTheDocument();
                });
            });

            describe('single edit', () => {
                it('displays the correct message when a counter was proposed', () => {
                    renderComponent({
                        props: {
                            isOrganizerMode: true,
                            invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                        },
                        vevent: { 'recurrence-id': dummyRecurrenceID },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.COUNTER,
                    });

                    expect(
                        screen.getByText(/test proposed a new time for one occurrence of this event./)
                    ).toBeInTheDocument();
                });
            });

            it('displays the correct message when a counter was proposed', () => {
                renderComponent({
                    props: {
                        isOrganizerMode: true,
                        invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                    },
                    attendee: getAttendee(),
                    method: ICAL_METHOD.COUNTER,
                });

                expect(screen.getByText(/test proposed a new time for this event./)).toBeInTheDocument();
            });
        });

        describe('method: refresh', () => {
            describe('no event from api', () => {
                it('displays the no calendars message when there are no calendars', () => {
                    renderComponent({
                        props: { isOrganizerMode: true, hasNoCalendars: true },
                        attendee: getAttendee(),
                        method: ICAL_METHOD.REFRESH,
                    });

                    expect(
                        screen.getByText(
                            /test asked for the latest updates to an event which does not exist anymore. You have no calendars./
                        )
                    ).toBeInTheDocument();
                });

                describe('decryption error', () => {
                    it('displays the accepted message when the event was accepted', () => {
                        renderComponent({
                            props: { isOrganizerMode: true, hasDecryptionError: true },
                            attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                            method: ICAL_METHOD.REFRESH,
                        });

                        expect(screen.getByText(/test asked for the latest event updates./)).toBeInTheDocument();
                    });
                });

                it('displays the accepted message when the event was accepted', () => {
                    renderComponent({
                        props: { isOrganizerMode: true },
                        attendee: getAttendee(ICAL_ATTENDEE_STATUS.ACCEPTED),
                        method: ICAL_METHOD.REFRESH,
                    });

                    expect(
                        screen.getByText(
                            /test asked for the latest updates to an event which does not exist in your calendar anymore./
                        )
                    ).toBeInTheDocument();
                });
            });

            it('displays the future message when the invite is from the future', () => {
                renderComponent({
                    props: {
                        isFromFuture: true,
                        isOrganizerMode: true,
                        invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                    },
                    attendee: getAttendee(),
                    method: ICAL_METHOD.REFRESH,
                });

                expect(
                    screen.getByText(
                        /test asked for the latest updates to an event which doesn't match your invitation details. Please verify the invitation details in your calendar./
                    )
                ).toBeInTheDocument();
            });

            it('displays the refresh message when the invitation was found', () => {
                renderComponent({
                    props: {
                        isOrganizerMode: true,
                        invitationApi: { vevent: veventBuilder(), calendarEvent: calendarEventBuilder() },
                    },
                    attendee: getAttendee(),
                    method: ICAL_METHOD.REFRESH,
                });

                expect(screen.getByText(/test asked for the latest event updates./)).toBeInTheDocument();
            });
        });
    });
});

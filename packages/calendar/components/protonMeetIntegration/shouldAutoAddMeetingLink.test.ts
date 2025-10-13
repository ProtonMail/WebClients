import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { shouldAutoAddMeetingLink } from './shouldAutoAddMeetingLink';

const mockMeetLink = 'https://meet.proton.me/join/id-1234567890#pwd-1234567890';
const mockZoomLink = 'https://zoom.us/j/1234567890';

describe('shouldAutoAddMeetingLink', () => {
    const defaultParams = {
        attendeesCount: 1,
        prevAttendeesCount: 0,
    };

    const defaultModel = {} as EventModel;

    describe('non-duplication cases', () => {
        it('should return true if the attendee count go from 0 to non-zero value, not having a conference url already', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: defaultModel,
                })
            ).toBe(true);
        });

        it('should return true if the attendee count go from 0 to non-zero value, having a temporary deleted Meet conference url', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: {
                        ...defaultModel,
                        conferenceUrl: mockMeetLink,
                        isConferenceTmpDeleted: true,
                        conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                    },
                })
            ).toBe(true);
        });

        it('should return false if the attendee count go from 0 to non-zero value, having a temporary deleted Zoom conference url', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: {
                        ...defaultModel,
                        conferenceUrl: mockMeetLink,
                        isConferenceTmpDeleted: true,
                        conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM,
                    },
                })
            ).toBe(false);
        });

        it('should return false when the previous attendee count is not 0', () => {
            expect(
                shouldAutoAddMeetingLink({
                    model: defaultModel,
                    prevAttendeesCount: 1,
                    attendeesCount: 2,
                })
            ).toBe(false);
        });

        it('should return false when having a video conference url and the conference is not temporary deleted', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, conferenceUrl: mockMeetLink, isConferenceTmpDeleted: false },
                })
            ).toBe(false);
        });

        it('should return false when having a valid video conference in the location', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, location: mockZoomLink },
                })
            ).toBe(false);
        });

        it('should return false when having a valid video conference in the description', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, description: mockZoomLink },
                })
            ).toBe(false);
        });
    });

    describe('duplication cases', () => {
        it('should return true if the attendee count is non-zero, the provider is not Zoom and have not tried to automatically add a meeting link to the duplicate event', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: {
                        ...defaultModel,
                        conferenceProvider: VIDEO_CONFERENCE_PROVIDER.PROTON_MEET,
                    },
                    isDuplicating: true,
                    triedAddingMeetingLinkToDuplicateEvent: false,
                })
            ).toBe(true);
        });

        it('should return true if the attendee count is non-zero, have tried to add a meeting link to the duplicate event and the attendee count goes from 0 to non-zero', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: defaultModel,
                    isDuplicating: true,
                    triedAddingMeetingLinkToDuplicateEvent: true,
                })
            ).toBe(true);
        });

        it('should return false if the attendee count is non-zero and the provider is Zoom and have not tried to automatically add a meeting link to the duplicate event', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, conferenceProvider: VIDEO_CONFERENCE_PROVIDER.ZOOM },
                    isDuplicating: true,
                    triedAddingMeetingLinkToDuplicateEvent: false,
                })
            ).toBe(false);
        });

        it('should return false if there is a valid video conference in the description', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, description: mockZoomLink },
                    isDuplicating: true,
                    triedAddingMeetingLinkToDuplicateEvent: false,
                })
            ).toBe(false);
        });

        it('should return false if there is a valid video conference in the location', () => {
            expect(
                shouldAutoAddMeetingLink({
                    ...defaultParams,
                    model: { ...defaultModel, location: mockZoomLink },
                })
            ).toBe(false);
        });
    });
});

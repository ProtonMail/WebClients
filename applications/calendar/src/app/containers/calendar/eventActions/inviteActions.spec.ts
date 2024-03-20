import { SendIcsParams } from '@proton/components/hooks/useSendIcs';
import { ICAL_ATTENDEE_ROLE, ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { buildMailTo } from '@proton/shared/lib/helpers/email';
import { omit } from '@proton/shared/lib/helpers/object';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { VcalAttendeeProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { GetVTimezonesMap } from '@proton/shared/lib/interfaces/hooks/GetVTimezonesMap';
import { RelocalizeText } from '@proton/shared/lib/interfaces/hooks/RelocalizeText';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';
import { generateTestAddress } from '@proton/testing/lib/builders';

import { INVITE_ACTION_TYPES } from '../../../interfaces/Invite';
import { AugmentedSendPreferences } from '../interface';
import { getAttendeesDiff, getHasProtonAttendees, getRoleDiff, getSendIcsAction } from './inviteActions';

const generateContact = ({
    mail,
    isInternal = false,
    internalWithEncryptionDisabled = false,
    rsvp = ICAL_ATTENDEE_RSVP.TRUE,
    role = ICAL_ATTENDEE_ROLE.REQUIRED,
}: {
    mail: string;
    isInternal?: boolean;
    internalWithEncryptionDisabled?: boolean;
    rsvp?: ICAL_ATTENDEE_RSVP;
    role?: ICAL_ATTENDEE_ROLE;
}) =>
    [
        {
            [mail]: {
                pgpScheme: isInternal ? PACKAGE_TYPE.SEND_PM : PACKAGE_TYPE.SEND_CLEAR,
                mimeType: 'text/plain',
                isInternal,
                encryptionDisabled: internalWithEncryptionDisabled,
            },
        },
        { [mail]: { Email: mail } },
        {
            value: buildMailTo(mail),
            parameters: { cn: mail, role, rsvp, partstat: 'NEEDS-ACTION' },
        },
    ] as unknown as [SimpleMap<AugmentedSendPreferences>, SimpleMap<ContactEmail>, VcalAttendeeProperty];

const contactA = generateContact({ mail: 'plus@proton.test', isInternal: true });
const contactB = generateContact({ mail: 'pmtest2@proton.test', isInternal: true });
const contactC = generateContact({ mail: 'chtest7@proton.test' });
const contactD = generateContact({ mail: 'test@alien.mars' });
const contactE = generateContact({ mail: 'plus@proton.test', internalWithEncryptionDisabled: true });

const baseVevent: VcalVeventComponent = {
    component: 'vevent',
    uid: { value: 'vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me' },
    sequence: { value: 0 },
    components: [],
    summary: { value: 'test 10' },
    organizer: { value: 'mailto:unlimited@proton.test', parameters: { cn: 'unlimited' } },
    dtstart: {
        value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 0, seconds: 0, isUTC: false },
        parameters: { tzid: 'Europe/Oslo' },
    },
    dtend: {
        value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 30, seconds: 0, isUTC: false },
        parameters: { tzid: 'Europe/Oslo' },
    },
    dtstamp: { value: { year: 2023, month: 5, day: 25, hours: 11, minutes: 46, seconds: 41, isUTC: true } },
};

const selfAddress = generateTestAddress();

const getVevent = (pseudoAttendees: { email: string; rsvp?: ICAL_ATTENDEE_RSVP; role?: ICAL_ATTENDEE_ROLE }[]) => {
    return {
        attendee: pseudoAttendees.map(({ email, rsvp, role }) => generateContact({ mail: email, rsvp, role })[2]),
    } as VcalVeventComponent;
};

describe('getSendIcsAction', () => {
    let getVTimezonesMapSpy: jest.SpyInstance<GetVTimezonesMap>;
    let relocalizeTextSpy: jest.SpyInstance<RelocalizeText>;
    let sendIcsSpy: jest.SpyInstance<(params: SendIcsParams) => Promise<void>>;
    let onRequestErrorSpy: jest.SpyInstance<(e: Error) => void>;
    let onReplyErrorSpy: jest.SpyInstance<(e: Error) => void>;
    let onCancelErrorSpy: jest.SpyInstance<(e: Error) => void>;
    let basedInviteParams = {};

    const generateInviteParams = ({
        vevent: inputVevent,
        cancelVevent: inputCancelVevent,
        inviteActions: inputInviteActions,
        sendPreferencesMap: inputSendPreferencesMap,
        contactEmailsMap: inputContactEmailsMap,
        ...rest
    }: Partial<Parameters<typeof getSendIcsAction>[0]> = {}) =>
        ({
            vevent: {
                ...{
                    status: { value: 'CONFIRMED' },
                    attendee: [contactA[2]],
                    ...baseVevent,
                },
                ...inputVevent,
            },
            cancelVevent: {
                ...{
                    status: { value: 'CONFIRMED' },
                    ...baseVevent,
                },
                ...inputCancelVevent,
            },
            inviteActions: {
                type: INVITE_ACTION_TYPES.SEND_INVITATION,
                selfAddress: selfAddress,
                addedAttendees: [],
                removedAttendees: [],
                hasRemovedAllAttendees: false,
                sharedEventID:
                    'nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvmDHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=',
                sharedSessionKey: 'VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=',
                ...inputInviteActions,
            },
            sendPreferencesMap: inputSendPreferencesMap ?? { ...contactA[0], ...contactB[0], ...contactC[0] },
            contactEmailsMap: inputContactEmailsMap ?? { ...contactA[1], ...contactB[1], ...contactC[1] },
            ...basedInviteParams,
            ...rest,
        }) as any;

    beforeEach(() => {
        getVTimezonesMapSpy = jest.fn().mockImplementation((tzs: string[]) => {
            return tzs.reduce(
                (acc, tz) => ({
                    ...acc,
                    [tz]: { vtimezone: { component: 'vtimezone', tzid: { value: tz } }, vtimezoneString: tz },
                }),
                {}
            );
        });
        relocalizeTextSpy = jest.fn().mockImplementation(({ getLocalizedText }) => getLocalizedText());
        sendIcsSpy = jest.fn();
        onRequestErrorSpy = jest.fn();
        onReplyErrorSpy = jest.fn();
        onCancelErrorSpy = jest.fn();

        basedInviteParams = {
            prodId: 'ProtonCal',
            getVTimezonesMap: getVTimezonesMapSpy,
            relocalizeText: relocalizeTextSpy,
            sendIcs: sendIcsSpy,
            onRequestError: onRequestErrorSpy,
            onReplyError: onReplyErrorSpy,
            onCancelError: onCancelErrorSpy,
        };
    });

    describe('when action type equals NONE', () => {
        it('should not send any email', async () => {
            const inviteParams = generateInviteParams({ inviteActions: { type: INVITE_ACTION_TYPES.NONE } });

            await getSendIcsAction({
                ...inviteParams,
                inviteActions: omit(inviteParams.inviteActions, ['selfAddress']),
            })();

            expect(sendIcsSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('when no self address', () => {
        it('should call `onRequestError`', async () => {
            const inviteParams = generateInviteParams();

            await expect(
                getSendIcsAction({ ...inviteParams, inviteActions: omit(inviteParams.inviteActions, ['selfAddress']) })
            ).rejects.toThrowError('Cannot reply without a self address');
        });
    });

    describe('when self address is inactive', () => {
        it('should call `onRequestError`', async () => {
            const inviteParams = generateInviteParams();

            await expect(
                getSendIcsAction({
                    ...inviteParams,
                    inviteActions: {
                        ...inviteParams.inviteActions,
                        selfAddress: omit(inviteParams.inviteActions.selfAddress, ['Send']),
                    },
                })
            ).rejects.toThrowError('Cannot send from an inactive address');
        });
    });

    describe('SEND_INVITATION', () => {
        describe('when no vevent', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.SEND_INVITATION,
                        selfAddress: selfAddress,
                    },
                });

                await getSendIcsAction(omit(inviteParams, ['vevent']) as any)();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(1);
                expect(onRequestErrorSpy).toHaveBeenCalledWith(
                    new Error('Cannot build invite ics without the event component')
                );
            });
        });

        describe('when no shared event data', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams();

                await getSendIcsAction({
                    ...inviteParams,
                    inviteActions: omit(inviteParams.inviteActions, ['sharedSessionKey']),
                })();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(1);
                expect(onRequestErrorSpy).toHaveBeenCalledWith(new Error('Missing shared event data'));
            });
        });

        it('should send invite and cancel ics to added and removed attendees', async () => {
            const vevent = {
                status: { value: 'CONFIRMED' },
                attendee: [contactA[2], contactC[2]],
                ...baseVevent,
            };
            const cancelVevent = {
                status: { value: 'CONFIRMED' },
                attendee: [contactA[2], contactB[2]],
                ...baseVevent,
            };

            const inviteParams = generateInviteParams({
                vevent,
                cancelVevent,
                inviteActions: {
                    type: INVITE_ACTION_TYPES.SEND_INVITATION,
                    selfAddress: selfAddress,
                    addedAttendees: [contactC[2]],
                    removedAttendees: [contactB[2]],
                },
            });

            await getSendIcsAction(inviteParams)();

            expect(sendIcsSpy).toHaveBeenCalledTimes(2);
            expect(sendIcsSpy).toHaveBeenNthCalledWith(1, {
                method: 'REQUEST',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:REQUEST\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nSTATUS:CONFIRMED\r\nATTENDEE;CN=plus@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-\r\n ACTION:mailto:plus@proton.test\r\nATTENDEE;CN=chtest7@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEE\r\n DS-ACTION:mailto:chtest7@proton.test\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nSEQUENCE:0\r\nSUMMARY:test 10\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nX-PM-SESSION-KEY:VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'chtest7@proton.test', Name: 'chtest7@proton.test' }],
                subject: 'Invitation for an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody:
                    'You are invited to test 10.\n\nTIME:\nWednesday May 31st, 2023 at 9:00 AM (GMT+2) - Wednesday May 31st, 2023 at 9:30 AM (GMT+2)',
                sendPreferencesMap: { ...contactA[0], ...contactB[0], ...contactC[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1], ...contactC[1] },
            });
            expect(sendIcsSpy).toHaveBeenNthCalledWith(2, {
                method: 'CANCEL',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:CANCEL\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nSEQUENCE:0\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nSUMMARY:test 10\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nATTENDEE:mailto:pmtest2@proton.test\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'pmtest2@proton.test', Name: 'pmtest2@proton.test' }],
                subject: 'Cancellation of an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody: 'test 10 was canceled.',
                sendPreferencesMap: { ...contactA[0], ...contactB[0], ...contactC[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1], ...contactC[1] },
            });

            expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
            expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);
            expect(onCancelErrorSpy).toHaveBeenCalledTimes(0);
        });

        describe('when new invitation', () => {
            it('should send invite ics to attendees', async () => {
                const [sendPreferencesMap, contactEmailsMap] = contactA;
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.SEND_INVITATION,
                        selfAddress: selfAddress,
                        addedAttendees: [
                            {
                                value: 'mailto:plus@proton.test',
                            },
                        ],
                    },
                    sendPreferencesMap,
                    contactEmailsMap,
                });

                await getSendIcsAction(inviteParams)();

                expect(sendIcsSpy).toHaveBeenCalledTimes(1);
                expect(sendIcsSpy).toHaveBeenCalledWith({
                    method: 'REQUEST',
                    ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:REQUEST\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nSTATUS:CONFIRMED\r\nATTENDEE;CN=plus@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-\r\n ACTION:mailto:plus@proton.test\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nSEQUENCE:0\r\nSUMMARY:test 10\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nX-PM-SESSION-KEY:VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=\r\nEND:VEVENT\r\nEND:VCALENDAR',
                    addressID:
                        'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                    from: {
                        Address: 'unlimited@proton.test',
                        Name: 'unlimited',
                    },
                    to: [
                        {
                            Address: 'plus@proton.test',
                            Name: 'plus@proton.test',
                        },
                    ],
                    subject: 'Invitation for an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                    plainTextBody:
                        'You are invited to test 10.\n\nTIME:\nWednesday May 31st, 2023 at 9:00 AM (GMT+2) - Wednesday May 31st, 2023 at 9:30 AM (GMT+2)',
                    sendPreferencesMap,
                    contactEmailsMap,
                });

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
                expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);
                expect(onCancelErrorSpy).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('SEND_UPDATE', () => {
        describe('when no vevent', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.SEND_UPDATE,
                        addedAttendees: [contactC[2]],
                        removedAttendees: [contactB[2]],
                        hasRemovedAllAttendees: false,
                    },
                });

                await getSendIcsAction(omit(inviteParams, ['vevent']) as any)();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(1);
                expect(onRequestErrorSpy).toHaveBeenCalledWith(
                    new Error('Cannot build invite ics without the event component')
                );
            });
        });

        describe('when no shared event data', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.SEND_UPDATE,
                        selfAddress: selfAddress,
                        addedAttendees: [contactC[2]],
                        removedAttendees: [contactB[2]],
                    },
                });

                await getSendIcsAction({
                    ...inviteParams,
                    inviteActions: omit(inviteParams.inviteActions, ['sharedSessionKey']),
                })();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(1);
                expect(onRequestErrorSpy).toHaveBeenCalledWith(new Error('Missing shared event data'));
            });
        });

        it('should send invite and cancel ICSs to remaining, added and removed attendees', async () => {
            const vevent = {
                status: { value: 'CONFIRMED' },
                attendee: [contactA[2], contactC[2]],
                ...baseVevent,
            };
            const cancelVevent = {
                status: { value: 'CONFIRMED' },
                attendee: [contactA[2], contactB[2]],
                ...baseVevent,
            };

            const inviteParams = generateInviteParams({
                vevent,
                cancelVevent,
                inviteActions: {
                    type: INVITE_ACTION_TYPES.SEND_UPDATE,
                    selfAddress: selfAddress,
                    addedAttendees: [contactC[2]],
                    removedAttendees: [contactB[2]],
                },
            });

            await getSendIcsAction(inviteParams)();

            expect(sendIcsSpy).toHaveBeenCalledTimes(3);
            expect(sendIcsSpy).toHaveBeenNthCalledWith(1, {
                method: 'REQUEST',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:REQUEST\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nSTATUS:CONFIRMED\r\nATTENDEE;CN=plus@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-\r\n ACTION:mailto:plus@proton.test\r\nATTENDEE;CN=chtest7@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEE\r\n DS-ACTION:mailto:chtest7@proton.test\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nSEQUENCE:0\r\nSUMMARY:test 10\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nX-PM-SESSION-KEY:VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'plus@proton.test', Name: 'plus@proton.test' }],
                subject: 'Update for an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody: 'This event was updated.',
                sendPreferencesMap: { ...contactA[0], ...contactB[0], ...contactC[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1], ...contactC[1] },
            });
            expect(sendIcsSpy).toHaveBeenNthCalledWith(2, {
                method: 'REQUEST',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:REQUEST\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nSTATUS:CONFIRMED\r\nATTENDEE;CN=plus@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEEDS-\r\n ACTION:mailto:plus@proton.test\r\nATTENDEE;CN=chtest7@proton.test;ROLE=REQ-PARTICIPANT;RSVP=TRUE;PARTSTAT=NEE\r\n DS-ACTION:mailto:chtest7@proton.test\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nSEQUENCE:0\r\nSUMMARY:test 10\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nX-PM-SESSION-KEY:VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'chtest7@proton.test', Name: 'chtest7@proton.test' }],
                subject: 'Invitation for an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody:
                    'You are invited to test 10.\n\nTIME:\nWednesday May 31st, 2023 at 9:00 AM (GMT+2) - Wednesday May 31st, 2023 at 9:30 AM (GMT+2)',
                sendPreferencesMap: { ...contactA[0], ...contactB[0], ...contactC[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1], ...contactC[1] },
            });
            expect(sendIcsSpy).toHaveBeenNthCalledWith(3, {
                method: 'CANCEL',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:CANCEL\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nSEQUENCE:0\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nSUMMARY:test 10\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nATTENDEE:mailto:pmtest2@proton.test\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'pmtest2@proton.test', Name: 'pmtest2@proton.test' }],
                subject: 'Cancellation of an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody: 'test 10 was canceled.',
                sendPreferencesMap: { ...contactA[0], ...contactB[0], ...contactC[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1], ...contactC[1] },
            });

            expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
            expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);
            expect(onCancelErrorSpy).toHaveBeenCalledTimes(0);
        });
    });

    describe('CANCEL_INVITATION', () => {
        describe('when no cancel vevent', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.CANCEL_INVITATION,
                        isProtonProtonInvite: false,
                        selfAddress,
                        sharedEventID:
                            'nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvmDHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=',
                        sharedSessionKey: 'VU373Q3lYxjkGTTiQvqLzvV0f7jtO4lldeC9InP04co=',
                    },
                    sendPreferencesMap: { ...contactA[0], ...contactB[0] },
                    contactEmailsMap: { ...contactA[1], ...contactB[1] },
                });

                await getSendIcsAction(omit(inviteParams, ['vevent', 'cancelVevent']) as any)();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
                expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);

                expect(onCancelErrorSpy).toHaveBeenCalledTimes(1);
                expect(onCancelErrorSpy).toHaveBeenCalledWith(
                    new Error('Cannot cancel invite ics without the old event component')
                );
            });
        });

        describe('when no shared event id', () => {
            it('should call `onRequestError`', async () => {
                const cancelVevent = {
                    status: { value: 'CONFIRMED' },
                    attendee: [contactA[2], contactB[2]],
                    ...baseVevent,
                };

                const inviteParams = generateInviteParams({
                    cancelVevent,
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.CANCEL_INVITATION,
                        selfAddress,
                    },
                    sendPreferencesMap: { ...contactA[0], ...contactB[0] },
                    contactEmailsMap: { ...contactA[1], ...contactB[1] },
                });

                await getSendIcsAction({
                    ...omit(inviteParams, ['vevent']),
                    inviteActions: omit(inviteParams.inviteActions, ['sharedEventID']),
                } as any)();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
                expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);

                expect(onCancelErrorSpy).toHaveBeenCalledTimes(1);
                expect(onCancelErrorSpy).toHaveBeenCalledWith(new Error('Missing shared event id'));
            });
        });

        describe('when no attendees', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: { type: INVITE_ACTION_TYPES.CANCEL_INVITATION, selfAddress },
                    sendPreferencesMap: { ...contactA[0], ...contactB[0] },
                    contactEmailsMap: { ...contactA[1], ...contactB[1] },
                });

                await getSendIcsAction({
                    ...omit(inviteParams, ['vevent']),
                    cancelVevent: omit(inviteParams.cancelVevent, ['attendee']),
                } as any)();

                expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
                expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);

                expect(onCancelErrorSpy).toHaveBeenCalledTimes(1);
                expect(onCancelErrorSpy).toHaveBeenCalledWith(new Error('Cannot build cancel ics without attendees'));
            });
        });

        it('should send cancel ics to attendees', async () => {
            const cancelVevent = {
                status: { value: 'CONFIRMED' },
                attendee: [contactA[2], contactB[2]],
                ...baseVevent,
            };

            const inviteParams = generateInviteParams({
                cancelVevent,
                inviteActions: { type: INVITE_ACTION_TYPES.CANCEL_INVITATION, selfAddress },
                sendPreferencesMap: { ...contactA[0], ...contactB[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1] },
            });

            // vevent should not be mandatory for invite cancellation
            await getSendIcsAction(omit(inviteParams, ['vevent']) as any)();

            expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
            expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);
            expect(onCancelErrorSpy).toHaveBeenCalledTimes(0);

            expect(sendIcsSpy).toHaveBeenCalledTimes(1);
            expect(sendIcsSpy).toHaveBeenCalledWith({
                method: 'CANCEL',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:CANCEL\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nSEQUENCE:1\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nSUMMARY:test 10\r\nDTSTAMP:20230525T114641Z\r\nX-PM-SHARED-EVENT-ID:nsgA6N6lbhgc1Fl49VHyNoBwtGpx-IHgBeyxaGUlw_3Pe3HMlo4qvm\r\n DHeV_RLSiT6plc-X9kS-ErcPJfHgYYiZwx6jwFrlk3ZnIdAyrupNM=\r\nATTENDEE:mailto:plus@proton.test\r\nATTENDEE:mailto:pmtest2@proton.test\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [
                    { Address: 'plus@proton.test', Name: 'plus@proton.test' },
                    { Address: 'pmtest2@proton.test', Name: 'pmtest2@proton.test' },
                ],
                subject: 'Cancellation of an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody: 'test 10 was canceled.',
                sendPreferencesMap: { ...contactA[0], ...contactB[0] },
                contactEmailsMap: { ...contactA[1], ...contactB[1] },
            });
        });
    });

    describe('CHANGE_PARTSTAT, DECLINE_INVITATION', () => {
        const unlimitedPreferenceMap = {
            'unlimited@newton.proton.black': {
                encrypt: true,
                sign: true,
                pgpScheme: 1,
                mimeType: 'text/plain',
                publicKeys: [
                    {
                        _idx: 412271857,
                        _keyContentHash: [
                            'ba431e1a4847b2f94f314f99c8e40ba0e0459df2900da8d65af630daba683cf5',
                            'ef48a12568b096a4119679192d0cff41c829a05de7d3b27f1be3aa0fa2aa677e',
                        ],
                        subkeys: [{}],
                    },
                ],
                isPublicKeyPinned: false,
                hasApiKeys: true,
                hasPinnedKeys: false,
                warnings: [],
            },
        } as unknown as SimpleMap<AugmentedSendPreferences>;

        describe('when no vevent', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                        isProtonProtonInvite: true,
                        partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                        selfAttendeeIndex: 0,
                    },
                    sendPreferencesMap: unlimitedPreferenceMap,
                    contactEmailsMap: {},
                });

                await getSendIcsAction(omit(inviteParams, ['vevent']) as any)();

                expect(onReplyErrorSpy).toHaveBeenCalledTimes(1);
                expect(onReplyErrorSpy).toHaveBeenCalledWith(
                    new Error('Cannot build invite ics without the event component')
                );
            });
        });

        describe('when no invitation data', () => {
            it('should call `onRequestError`', async () => {
                const inviteParams = generateInviteParams({
                    inviteActions: {
                        isProtonProtonInvite: true,
                        type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                        partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                        selfAddress,
                        selfAttendeeIndex: 0,
                    },
                    sendPreferencesMap: unlimitedPreferenceMap,
                    contactEmailsMap: {},
                });

                await getSendIcsAction({ ...inviteParams, vevent: omit(inviteParams.vevent, ['attendee']) })();

                expect(onReplyErrorSpy).toHaveBeenCalledTimes(1);
                expect(onReplyErrorSpy).toHaveBeenCalledWith(new Error('Missing invitation data'));
            });
        });

        it('should send reply ics to organizer', async () => {
            const inviteParams = generateInviteParams({
                vevent: {
                    attendee: [contactA[2]],
                } as VcalVeventComponent,
                inviteActions: {
                    isProtonProtonInvite: true,
                    type: INVITE_ACTION_TYPES.CHANGE_PARTSTAT,
                    partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
                    selfAddress,
                    selfAttendeeIndex: 0,
                },
                sendPreferencesMap: unlimitedPreferenceMap,
                contactEmailsMap: {},
            });

            await getSendIcsAction(inviteParams as any)();

            expect(onRequestErrorSpy).toHaveBeenCalledTimes(0);
            expect(onReplyErrorSpy).toHaveBeenCalledTimes(0);
            expect(onCancelErrorSpy).toHaveBeenCalledTimes(0);

            expect(sendIcsSpy).toHaveBeenCalledTimes(1);
            expect(sendIcsSpy).toHaveBeenCalledWith({
                method: 'REPLY',
                ics: 'BEGIN:VCALENDAR\r\nPRODID:ProtonCal\r\nVERSION:2.0\r\nMETHOD:REPLY\r\nCALSCALE:GREGORIAN\r\nBEGIN:VTIMEZONE\r\nTZID:Europe/Oslo\r\nEND:VTIMEZONE\r\nBEGIN:VEVENT\r\nUID:vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me\r\nDTSTART;TZID=Europe/Oslo:20230531T090000\r\nDTEND;TZID=Europe/Oslo:20230531T093000\r\nSEQUENCE:0\r\nORGANIZER;CN=unlimited:mailto:unlimited@proton.test\r\nSUMMARY:test 10\r\nDTSTAMP:20230525T114641Z\r\nX-PM-PROTON-REPLY;VALUE=BOOLEAN:TRUE\r\nATTENDEE;PARTSTAT=ACCEPTED:mailto:plus@proton.test\r\nEND:VEVENT\r\nEND:VCALENDAR',
                addressID: 'fHR97Meg0sNme5k8IFa2umNtk5FjTUA7FbImbZj7RIO3U5hMmGk8_NF6a7qgSZ2QviSQmEg7Qib9xfLEdjCdXA==',
                from: { Address: 'unlimited@proton.test', Name: 'unlimited' },
                to: [{ Address: 'unlimited@proton.test', Name: 'unlimited' }],
                subject: 'Re: Invitation for an event starting on Wednesday May 31st, 2023 at 9:00 AM (GMT+2)',
                plainTextBody: 'plus@proton.test accepted your invitation to test 10',
                sendPreferencesMap: unlimitedPreferenceMap,
                contactEmailsMap: {},
            });
        });
    });
});

describe('getHasProtonAttendees()', () => {
    const sendPreferencesMap = {
        ...contactA[0],
        ...contactB[0],
        ...contactC[0],
        ...contactD[0],
    };

    it('returns false when there are no attendees', () => {
        expect(getHasProtonAttendees(baseVevent, sendPreferencesMap)).toEqual(false);
    });

    it('returns false when there are no Proton attendees', () => {
        expect(
            getHasProtonAttendees(
                {
                    ...baseVevent,
                    attendee: [contactC[2], contactD[2]],
                },
                sendPreferencesMap
            )
        ).toEqual(false);
    });

    it('returns false when there are Proton attendees but there are no send preferences for the attendee email', () => {
        expect(
            getHasProtonAttendees(
                {
                    ...baseVevent,
                    attendee: [contactA[2], contactB[2]],
                },
                {}
            )
        ).toEqual(false);
    });

    it('returns true when there is only one Proton attendee', () => {
        expect(
            getHasProtonAttendees(
                {
                    ...baseVevent,
                    attendee: [contactA[2]],
                },
                sendPreferencesMap
            )
        ).toEqual(true);
    });

    it('returns true when there is at least one Proton attendee', () => {
        expect(
            getHasProtonAttendees(
                {
                    ...baseVevent,
                    attendee: [contactB[2], contactC[2], contactD[2]],
                },
                sendPreferencesMap
            )
        ).toEqual(true);
    });

    it('returns true when there is one Proton attendee with external forwarding enabled', () => {
        expect(
            getHasProtonAttendees(
                {
                    ...baseVevent,
                    attendee: [contactC[2], contactD[2], contactE[2]],
                },
                sendPreferencesMap
            )
        ).toEqual(true);
    });
});

describe('getRoleDiff', () => {
    it('should have no role diff when events have the same data', () => {
        const vevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
        ]);

        expect(getRoleDiff(vevent, vevent)).toBeFalsy();
    });

    it('should have no role status diff when event has no attendee', () => {
        const vevent = getVevent([]);

        expect(getRoleDiff(vevent, vevent)).toBeFalsy();
    });

    it('should have no role diff when some attendees have been removed or added', () => {
        const oldVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
        ]);

        const newVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user3@proton.me', role: ICAL_ATTENDEE_ROLE.OPTIONAL },
        ]);

        expect(getRoleDiff(newVevent, oldVevent)).toBeFalsy();
    });

    it('should have role status diff when some roles have been updated', () => {
        const oldVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
        ]);

        const newVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.OPTIONAL },
        ]);

        expect(getRoleDiff(newVevent, oldVevent)).toBeTruthy();
    });
});

describe('getAttendeesDiff', () => {
    it('should have no attendee diff', () => {
        const vevent = getVevent([
            { email: 'user1@proton.me', rsvp: ICAL_ATTENDEE_RSVP.TRUE },
            { email: 'user2@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE },
        ]);

        const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(vevent, vevent);

        expect(addedAttendees).toHaveLength(0);
        expect(removedAttendees).toHaveLength(0);
        expect(hasModifiedRole).toBeFalsy();
    });

    it('should have a diff when adding attendees', () => {
        const oldVevent = getVevent([
            { email: 'user1@proton.me', rsvp: ICAL_ATTENDEE_RSVP.TRUE },
            { email: 'user2@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE },
        ]);

        const newVevent = getVevent([
            { email: 'user1@proton.me', rsvp: ICAL_ATTENDEE_RSVP.TRUE },
            { email: 'user2@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE },
            { email: 'user3@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE },
        ]);

        const addedAttendee = generateContact({ mail: 'user3@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE })[2];

        const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(newVevent, oldVevent);

        expect(addedAttendees).toEqual([addedAttendee]);
        expect(removedAttendees).toHaveLength(0);
        expect(hasModifiedRole).toBeFalsy();
    });

    it('should have a diff when removing attendees', () => {
        const oldVevent = getVevent([
            { email: 'user1@proton.me', rsvp: ICAL_ATTENDEE_RSVP.TRUE },
            { email: 'user2@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE },
        ]);

        const newVevent = getVevent([{ email: 'user1@proton.me', rsvp: ICAL_ATTENDEE_RSVP.TRUE }]);

        const removedAttendee = generateContact({ mail: 'user2@proton.me', rsvp: ICAL_ATTENDEE_RSVP.FALSE })[2];

        const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(newVevent, oldVevent);

        expect(addedAttendees).toHaveLength(0);
        expect(removedAttendees).toEqual([removedAttendee]);
        expect(hasModifiedRole).toBeFalsy();
    });

    it('should have a diff when updating role', () => {
        const oldVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
        ]);

        const newVevent = getVevent([
            { email: 'user1@proton.me', role: ICAL_ATTENDEE_ROLE.REQUIRED },
            { email: 'user2@proton.me', role: ICAL_ATTENDEE_ROLE.OPTIONAL },
        ]);

        const { addedAttendees, removedAttendees, hasModifiedRole } = getAttendeesDiff(newVevent, oldVevent);

        expect(addedAttendees).toHaveLength(0);
        expect(removedAttendees).toHaveLength(0);
        expect(hasModifiedRole).toBeTruthy();
    });
});

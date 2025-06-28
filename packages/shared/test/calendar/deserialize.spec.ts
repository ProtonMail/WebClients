import { ICAL_ATTENDEE_STATUS } from '@proton/shared/lib/calendar/constants';
import { getSelfAddressData } from '@proton/shared/lib/calendar/deserialize';
import { buildVcalOrganizer } from '@proton/shared/lib/calendar/vcalConverter';
import { ADDRESS_RECEIVE, ADDRESS_SEND, ADDRESS_STATUS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { buildMailTo } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';

const buildVcalAttendee = ({
    email,
    cn,
    partstat,
}: {
    email: string;
    cn?: string;
    partstat?: ICAL_ATTENDEE_STATUS;
}) => {
    return {
        value: buildMailTo(email),
        parameters: {
            cn: cn || email,
            partstat: partstat || ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
        },
    };
};

describe('getSelfAddressData()', () => {
    const originalAddress = {
        DisplayName: 'I',
        Email: 'me@proton.me',
        ID: '1',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    } as Address;
    const freePmMeAddress = {
        DisplayName: "It's me",
        Email: 'me@pm.me',
        ID: '2',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_NO,
        Type: ADDRESS_TYPE.TYPE_PREMIUM,
    } as Address;
    const protonMailAddress = {
        DisplayName: "It's still me",
        Email: 'me@protonmail.com',
        ID: '3',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Type: ADDRESS_TYPE.TYPE_ALIAS,
    } as Address;
    const protonMailChAddress = {
        DisplayName: "It's me in CH",
        Email: 'me@protonmail.ch',
        ID: '4',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Type: ADDRESS_TYPE.TYPE_ALIAS,
    } as Address;
    const aliasDisabledAddress = {
        DisplayName: 'Disabled me',
        Email: 'disabled_alias@protonmail.com',
        ID: '5',
        Status: ADDRESS_STATUS.STATUS_DISABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_NO,
        Send: ADDRESS_SEND.SEND_NO,
        Type: ADDRESS_TYPE.TYPE_ALIAS,
    } as Address;
    const customDomainAddress = {
        DisplayName: 'Never gonna give you up',
        Email: 'rick@does.not.give.you.up',
        ID: '6',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_YES,
        Send: ADDRESS_SEND.SEND_YES,
        Type: ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN,
    } as Address;
    const externalAddress = {
        DisplayName: 'Much crypto',
        Email: 'someone_else@else.888',
        ID: '7',
        Status: ADDRESS_STATUS.STATUS_ENABLED,
        Receive: ADDRESS_RECEIVE.RECEIVE_NO,
        Send: ADDRESS_SEND.SEND_NO,
        Type: ADDRESS_TYPE.TYPE_EXTERNAL,
    } as Address;

    const addresses = [
        originalAddress,
        freePmMeAddress,
        protonMailAddress,
        protonMailChAddress,
        aliasDisabledAddress,
        customDomainAddress,
        externalAddress,
    ];

    it('identifies me as an organizer when organizing an event', () => {
        const organizer = buildVcalOrganizer('me@proton.me');

        const protonAttendee = buildVcalAttendee({
            email: 'someone@proton.me',
            cn: 'proton',
            partstat: ICAL_ATTENDEE_STATUS.DECLINED,
        });
        const externalAttendee = buildVcalAttendee({
            email: 'someone_else@else.888',
            cn: 'BTC',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
        });
        const attendees = [protonAttendee, externalAttendee];

        expect(getSelfAddressData({ organizer, attendees, addresses })).toEqual({
            isOrganizer: true,
            isAttendee: false,
            selfAddress: originalAddress,
        });
    });

    it('does not identify me as an organizer when organizing an event with an external address', () => {
        const organizer = buildVcalOrganizer(externalAddress.Email);

        const protonAttendee = buildVcalAttendee({
            email: 'someone@proton.me',
            cn: 'proton',
            partstat: ICAL_ATTENDEE_STATUS.DECLINED,
        });
        const otherAttendee = buildVcalAttendee({
            email: 'other@888',
            cn: 'The others',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
        });
        const attendees = [protonAttendee, otherAttendee];

        expect(getSelfAddressData({ organizer, attendees, addresses })).toEqual({
            isOrganizer: false,
            isAttendee: false,
            selfAddress: undefined,
            selfAttendee: undefined,
            selfAttendeeIndex: undefined,
        });
    });

    it('does not identify me as an attendee when attending an event with an external address', () => {
        const organizer = buildVcalOrganizer('someone@proton.me');

        const externalAddressAttendee = buildVcalAttendee({
            email: externalAddress.Email,
            cn: 'proton',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
        });
        const otherAttendee = buildVcalAttendee({
            email: 'other@888',
            cn: 'The others',
            partstat: ICAL_ATTENDEE_STATUS.TENTATIVE,
        });
        const attendees = [externalAddressAttendee, otherAttendee];

        expect(getSelfAddressData({ organizer, attendees, addresses })).toEqual({
            isOrganizer: false,
            isAttendee: false,
            selfAddress: undefined,
            selfAttendee: undefined,
            selfAttendeeIndex: undefined,
        });
    });

    describe('identifies me as an attendee when attending an event', () => {
        const organizer = buildVcalOrganizer('someone@proton.me');

        it('picks first active answered attendee', () => {
            const originalAttendee = buildVcalAttendee({
                email: originalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const freePmMeAttendee = buildVcalAttendee({
                email: freePmMeAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const protonMailAttendee = buildVcalAttendee({
                email: protonMailAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const protonMailChAttendee = buildVcalAttendee({
                email: protonMailChAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.TENTATIVE,
            });
            const aliasDisabledAttendee = buildVcalAttendee({
                email: aliasDisabledAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.DECLINED,
            });
            const customDomainAttendee = buildVcalAttendee({
                email: customDomainAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const externalAttendee = buildVcalAttendee({
                email: externalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });

            expect(
                getSelfAddressData({
                    organizer,
                    attendees: [
                        externalAttendee,
                        customDomainAttendee,
                        freePmMeAttendee,
                        aliasDisabledAttendee,
                        originalAttendee,
                        protonMailAttendee,
                        protonMailChAttendee,
                    ],
                    addresses,
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAddress: protonMailChAddress,
                selfAttendee: protonMailChAttendee,
                selfAttendeeIndex: 6,
            });
        });

        it('picks first active unanswered attendee if only inactive answered', () => {
            const originalAttendee = buildVcalAttendee({
                email: originalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const freePmMeAttendee = buildVcalAttendee({
                email: freePmMeAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const protonMailAttendee = buildVcalAttendee({
                email: protonMailAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const protonMailChAttendee = buildVcalAttendee({
                email: protonMailChAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const aliasDisabledAttendee = buildVcalAttendee({
                email: aliasDisabledAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const customDomainAttendee = buildVcalAttendee({
                email: customDomainAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const externalAttendee = buildVcalAttendee({
                email: externalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });

            expect(
                getSelfAddressData({
                    organizer,
                    attendees: [
                        externalAttendee,
                        customDomainAttendee,
                        freePmMeAttendee,
                        aliasDisabledAttendee,
                        originalAttendee,
                        protonMailAttendee,
                        protonMailChAttendee,
                    ],
                    addresses,
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAddress: originalAddress,
                selfAttendee: originalAttendee,
                selfAttendeeIndex: 4,
            });
        });

        it('picks first inactive answered attendee if all inactive', () => {
            const freePmMeAttendee = buildVcalAttendee({
                email: freePmMeAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const aliasDisabledAttendee = buildVcalAttendee({
                email: aliasDisabledAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.DECLINED,
            });
            const externalAttendee = buildVcalAttendee({
                email: externalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });

            expect(
                getSelfAddressData({
                    organizer,
                    attendees: [externalAttendee, freePmMeAttendee, aliasDisabledAttendee],
                    addresses,
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAddress: aliasDisabledAddress,
                selfAttendee: aliasDisabledAttendee,
                selfAttendeeIndex: 2,
            });
        });
    });

    it('identifies me as an attendee when using a pm.me address', () => {
        const organizer = buildVcalOrganizer('other@proton.me');

        const anotherAttendee = buildVcalAttendee({ email: 'another@not_proton.me', cn: 'external' });
        const pmMeAttendee = buildVcalAttendee({
            email: 'me@pm.me',
            cn: 'MEEE',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
        });
        const attendees = [anotherAttendee, pmMeAttendee];

        const originalAddress = {
            DisplayName: 'I',
            Email: 'me@proton.me',
            ID: '1',
            Receive: ADDRESS_RECEIVE.RECEIVE_YES,
            Send: ADDRESS_SEND.SEND_YES,
            Type: ADDRESS_TYPE.TYPE_ORIGINAL,
        } as Address;
        const pmMeAddress = {
            DisplayName: "It's me",
            Email: 'me@pm.me',
            ID: '2',
            Receive: ADDRESS_RECEIVE.RECEIVE_YES,
            Send: ADDRESS_SEND.SEND_NO,
            Type: ADDRESS_TYPE.TYPE_PREMIUM,
        } as Address;
        const addresses = [originalAddress, pmMeAddress];

        expect(getSelfAddressData({ organizer, attendees, addresses })).toEqual({
            isOrganizer: false,
            isAttendee: true,
            selfAttendee: pmMeAttendee,
            selfAddress: pmMeAddress,
            selfAttendeeIndex: 1,
        });
    });

    describe('identifies me as an attendee when invited via external emailTo address', () => {
        const organizer = buildVcalOrganizer('organizer@example.com');

        it('matches external email address with catch-all address', () => {
            const externalAttendee = buildVcalAttendee({
                email: 'user@external-domain.com',
                cn: 'External Email User',
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            });
            const otherAttendee = buildVcalAttendee({
                email: 'other@example.com',
                cn: 'Other Person',
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const attendees = [otherAttendee, externalAttendee];

            const catchAllAddress = {
                DisplayName: 'My Catch All',
                Email: 'catchall@proton.me',
                ID: '1',
                Status: ADDRESS_STATUS.STATUS_ENABLED,
                Receive: ADDRESS_RECEIVE.RECEIVE_YES,
                Send: ADDRESS_SEND.SEND_YES,
                Type: ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN,
                CatchAll: true,
            } as Address;
            const regularAddress = {
                DisplayName: 'Regular Address',
                Email: 'regular@proton.me',
                ID: '2',
                Status: ADDRESS_STATUS.STATUS_ENABLED,
                Receive: ADDRESS_RECEIVE.RECEIVE_YES,
                Send: ADDRESS_SEND.SEND_YES,
                Type: ADDRESS_TYPE.TYPE_ORIGINAL,
                CatchAll: false,
            } as Address;
            const addresses = [catchAllAddress, regularAddress];

            expect(
                getSelfAddressData({
                    organizer,
                    attendees,
                    addresses,
                    emailTo: 'user@external-domain.com',
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAttendee: externalAttendee,
                selfAddress: catchAllAddress,
                selfAttendeeIndex: 1,
            });
        });

        it('matches external email address without catch-all address', () => {
            const forwardingAttendee = buildVcalAttendee({
                email: 'work@company.com',
                cn: 'Work Email',
                partstat: ICAL_ATTENDEE_STATUS.TENTATIVE,
            });
            const attendees = [forwardingAttendee];

            const firstAddress = {
                DisplayName: 'First Address',
                Email: 'first@proton.me',
                ID: '1',
                Status: ADDRESS_STATUS.STATUS_ENABLED,
                Receive: ADDRESS_RECEIVE.RECEIVE_YES,
                Send: ADDRESS_SEND.SEND_YES,
                Type: ADDRESS_TYPE.TYPE_ORIGINAL,
                CatchAll: false,
            } as Address;
            const secondAddress = {
                DisplayName: 'Second Address',
                Email: 'second@proton.me',
                ID: '2',
                Status: ADDRESS_STATUS.STATUS_ENABLED,
                Receive: ADDRESS_RECEIVE.RECEIVE_YES,
                Send: ADDRESS_SEND.SEND_YES,
                Type: ADDRESS_TYPE.TYPE_PREMIUM,
                CatchAll: false,
            } as Address;
            const addresses = [firstAddress, secondAddress];

            expect(
                getSelfAddressData({
                    organizer,
                    attendees,
                    addresses,
                    emailTo: 'work@company.com',
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAttendee: forwardingAttendee,
                selfAddress: firstAddress,
                selfAttendeeIndex: 0,
            });
        });

        it('does not match when emailTo is not in attendee list', () => {
            const attendee = buildVcalAttendee({
                email: 'someone@example.com',
                cn: 'Someone',
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const attendees = [attendee];

            expect(
                getSelfAddressData({
                    organizer,
                    attendees,
                    addresses,
                    emailTo: 'notinlist@external.com',
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: false,
                selfAddress: undefined,
                selfAttendee: undefined,
                selfAttendeeIndex: undefined,
            });
        });

        it('prefers inactive address over emailTo match when both are present', () => {
            const aliasDisabledAttendee = buildVcalAttendee({
                email: aliasDisabledAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const aliasEmailToAttendee = buildVcalAttendee({
                email: 'emailto@example.com',
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const attendees = [aliasEmailToAttendee, aliasDisabledAttendee];

            expect(
                getSelfAddressData({
                    organizer,
                    attendees,
                    addresses,
                    emailTo: 'emailto@example.com',
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: true,
                selfAttendee: aliasDisabledAttendee,
                selfAddress: aliasDisabledAddress,
                selfAttendeeIndex: 1,
            });
        });

        it('handles case when no internal addresses nor emailTo are available', () => {
            const externalAttendee = buildVcalAttendee({
                email: externalAddress.Email,
                partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            });
            const attendees = [externalAttendee];
            const addresses = [externalAddress];

            expect(
                getSelfAddressData({
                    organizer,
                    attendees,
                    addresses,
                })
            ).toEqual({
                isOrganizer: false,
                isAttendee: false,
                selfAddress: undefined,
                selfAttendee: undefined,
                selfAttendeeIndex: undefined,
            });
        });
    });
});

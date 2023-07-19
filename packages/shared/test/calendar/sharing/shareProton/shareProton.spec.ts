import { MEMBER_PERMISSIONS } from '@proton/shared/lib/calendar/permissions';
import { getSharedCalendarSubHeaderText } from '@proton/shared/lib/calendar/sharing/shareProton/shareProton';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

describe('shareProton', () => {
    describe('getSharedCalendarSubHeaderText', () => {
        const baseCalendar = {
            Name: 'Testing calendar',
            Type: 0,
            Owner: {
                Email: 'plus@proton.black',
            },
            Members: [
                {
                    Email: 'pro@proton.black',
                    Name: 'My calendar',
                },
            ],
            Email: 'pro@proton.black',
        } as VisualCalendar;

        it('should return undefined when calendar is not a shared one', () => {
            expect(
                getSharedCalendarSubHeaderText(
                    {
                        ...baseCalendar,
                        Owner: {
                            Email: 'pro@proton.black',
                        },
                    },
                    {}
                )
            ).toBeUndefined();
        });

        it('should return good sub header when calendar is writable', () => {
            expect(
                getSharedCalendarSubHeaderText(
                    {
                        ...baseCalendar,
                        Permissions: MEMBER_PERMISSIONS.EDIT,
                    },
                    {}
                )
            ).toEqual('Shared by plus@proton.black');
        });

        it('should return good sub header when calendar is only readable', () => {
            expect(
                getSharedCalendarSubHeaderText(
                    {
                        ...baseCalendar,
                        Permissions: MEMBER_PERMISSIONS.FULL_VIEW,
                    },
                    {}
                )
            ).toEqual('Shared by plus@proton.black');
        });
    });
});

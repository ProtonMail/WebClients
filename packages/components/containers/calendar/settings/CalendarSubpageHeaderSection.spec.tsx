import type { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import { mockUseContactEmailsCache } from '@proton/testing';

import CalendarSubpageHeaderSection from './CalendarSubpageHeaderSection';

const defaultCalendar = {
    ID: 'FV6FNtAc6lgP6R7dM7YB5N3LzHuoBMyivBSqjPcDfIbuMf5MdvXlCmMMcBY57-wdG-hQk4qhFb5lDEJyxjySpQ==',
};

const ownedCalendar = {
    ID: 'FV6FNtAc6lgP6R7dM7YB5N3LzHuoBMyivBSqjPcDfIbuMf5MdvXlCmMMcBY57-wdG-hQk4qhFb5lDEJyxjySpQ==',
    Name: 'My calendar',
    Description: '',
    Type: 0,
    Owner: {
        Email: 'joshua@yomail.com',
    },
    CreateTime: 1688650068,
    Members: [
        {
            ID: 'FV6FNtAc6lgP6R7dM7YB5N3LzHuoBMyivBSqjPcDfIbuMf5MdvXlCmMMcBY57-wdG-hQk4qhFb5lDEJyxjySpQ==',
            Permissions: 127,
            Email: 'joshua@yomail.com',
            AddressID: 'p5DPgsgSOQhwxfZmy4A-vVIxHd40lH8xRVg_4ulz69pz7Ox7ibSa2QXEbMg151clLRB-CQQTCRNteaIBHL_iUg==',
            CalendarID: 'FV6FNtAc6lgP6R7dM7YB5N3LzHuoBMyivBSqjPcDfIbuMf5MdvXlCmMMcBY57-wdG-hQk4qhFb5lDEJyxjySpQ==',
            Name: 'My calendar',
            Description: '',
            Color: '#DB60D6',
            Display: 1,
            Priority: 1,
            Flags: 1,
        },
    ],
    Color: '#DB60D6',
    Display: 1,
    Email: 'joshua@yomail.com',
    Flags: 1,
    Permissions: 127,
    Priority: 1,
};

const readonlySharedCalendar = {
    ID: 'W6E2R1LyNeueUxuR_1VjbM3M2UoGKPqPrRhGwrqRlLyoweZNyLx4xGKqw6f6hUXPDdaBUzoDUQpmC689IaZccw==',
    Name: 'Test read only',
    Description: '',
    Type: 0,
    Owner: {
        Email: 'plus@steno.proton.black',
    },
    CreateTime: 1688992242,
    Members: [
        {
            ID: 'IlnTbqicN-2HfUGIn-ki8bqZfLqNj5ErUB0z24Qx5g-4NvrrIc6GLvEpj2EPfwGDv28aKYVRRrSgEFhR_zhlkA==',
            Permissions: 96,
            Email: 'joshua@yomail.com',
            AddressID: 'p5DPgsgSOQhwxfZmy4A-vVIxHd40lH8xRVg_4ulz69pz7Ox7ibSa2QXEbMg151clLRB-CQQTCRNteaIBHL_iUg==',
            CalendarID: 'W6E2R1LyNeueUxuR_1VjbM3M2UoGKPqPrRhGwrqRlLyoweZNyLx4xGKqw6f6hUXPDdaBUzoDUQpmC689IaZccw==',
            Name: 'Test read only',
            Description: '',
            Color: '#0F735A',
            Display: 1,
            Priority: 3,
            Flags: 1,
        },
    ],
    Color: '#0F735A',
    Display: 1,
    Email: 'joshua@yomail.com',
    Flags: 1,
    Permissions: 96,
    Priority: 1,
};

const writeSharedCalendar = {
    ID: 'BvbqbySUPo9uWW_eR8tLA13NUsQMz3P4Zhw4UnpvrKqURnrHlE6L2Au0nplHfHlVXFgGz4L4hJ9-BYllOL-L5g==',
    Name: 'Test Write',
    Description: '',
    Type: 0,
    Owner: {
        Email: 'plus@steno.proton.black',
    },
    CreateTime: 1688992227,
    Members: [
        {
            ID: 'QVcbf04GzTJosFX36v47-82MiZqyItZKjbWdo5O8O5WAJQHPKlnGBfmf290e2jpbWRL3U5415dWDUSwXoWJJHQ==',
            Permissions: 112,
            Email: 'joshua@yomail.com',
            AddressID: 'p5DPgsgSOQhwxfZmy4A-vVIxHd40lH8xRVg_4ulz69pz7Ox7ibSa2QXEbMg151clLRB-CQQTCRNteaIBHL_iUg==',
            CalendarID: 'BvbqbySUPo9uWW_eR8tLA13NUsQMz3P4Zhw4UnpvrKqURnrHlE6L2Au0nplHfHlVXFgGz4L4hJ9-BYllOL-L5g==',
            Name: 'Test Write',
            Description: '',
            Color: '#807304',
            Display: 1,
            Priority: 2,
            Flags: 1,
        },
    ],
    Color: '#807304',
    Display: 1,
    Email: 'joshua@yomail.com',
    Flags: 1,
    Permissions: 112,
    Priority: 1,
};

const baseArgs = {
    calendar: ownedCalendar,
    defaultCalendar,
    holidaysCalendars: [],
    canEdit: true,
} as unknown as ComponentProps<typeof CalendarSubpageHeaderSection>;

describe('CalendarSubpageHeaderSection', () => {
    describe('when calendar is owned', () => {
        it('should display user calendar address', () => {
            mockUseContactEmailsCache();
            render(<CalendarSubpageHeaderSection {...baseArgs} />);
            expect(screen.getByText('joshua@yomail.com'));
        });
    });

    describe('when calendar is default one', () => {
        it('should display a badge', () => {
            mockUseContactEmailsCache();
            render(<CalendarSubpageHeaderSection {...baseArgs} />);
            expect(screen.getByText('Default'));
        });
    });

    describe('when calendar is shared', () => {
        describe('when user has only read access', () => {
            it('should display `View only` and owner address', () => {
                mockUseContactEmailsCache();
                const props = { ...baseArgs, calendar: readonlySharedCalendar };
                render(<CalendarSubpageHeaderSection {...props} />);

                expect(screen.getByText('Shared by plus@steno.proton.black'));
                expect(screen.getByText('View only • joshua@yomail.com'));
            });
        });

        describe('when user has write access', () => {
            it('should display owner address', () => {
                mockUseContactEmailsCache();
                const props = { ...baseArgs, calendar: writeSharedCalendar };
                render(<CalendarSubpageHeaderSection {...props} />);

                expect(screen.getByText('Shared by plus@steno.proton.black'));
                expect(screen.queryByText('View only')).not.toBeInTheDocument();
            });
        });
    });
});

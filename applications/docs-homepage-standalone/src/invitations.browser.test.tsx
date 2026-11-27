import type { HomepageDependencies } from 'proton-docs/homepage';
import { page, userEvent } from 'vitest/browser';

import { type PendingInvitation, invitationsDependencies } from './mocks/invitations';
import { recentsDependencies } from './mocks/recents';
import { documentsTable, inviteRows, invitesTable, openHomepage, sidebar } from './test/browser';

const launchChecklist: PendingInvitation = {
    invitationId: 'launch',
    name: 'Launch checklist',
    type: 'spreadsheet',
    inviterEmail: 'bob@example.com',
};
const meetingNotes: PendingInvitation = {
    invitationId: 'meeting',
    name: 'Meeting notes',
    type: 'document',
    inviterEmail: 'alice@example.com',
};
const budget = { linkId: 'budget', name: 'Budget', type: 'spreadsheet' } as const;

const acceptButton = 'Accept invitation to document';
const declineButton = 'Decline invitation to document';

/** `count` invitations, from "Invitation 1" on. */
function manyInvitations(count: number): PendingInvitation[] {
    return Array.from({ length: count }, (_, index) => ({
        invitationId: `invitation-${index + 1}`,
        name: `Invitation ${index + 1}`,
        type: 'document',
        inviterEmail: 'bob@example.com',
    }));
}

/** An absolute `getAppHref`, as the Docs app's, which points to the app's own domain. */
const getAppHref: HomepageDependencies['getAppHref'] = (path, app) => `https://${app}.example${path}`;

/** Stubs `window.open`, so that no tab opens, with the blank tab the homepage opens before it knows the address. */
function stubBlankTab() {
    const tab = { location: { assign: vi.fn() } };
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    return { open, assign: tab.location.assign };
}

describe('pending invitations', () => {
    it('lists an invitation with who shared it and its file type', async () => {
        openHomepage('/recents', invitationsDependencies([launchChecklist, meetingNotes]));

        await expect.element(invitesTable).toMatchTextContent(/Pending invitations\s*2/);
        const launchRow = inviteRows.filter({ hasText: 'Launch checklist' });
        await expect.element(launchRow).toMatchTextContent('bob@example.com');
        await expect.element(launchRow).toMatchTextContent('Just now');
        await expect.element(inviteRows.filter({ hasText: 'Meeting notes' })).toMatchTextContent('alice@example.com');
        // Each row's icon, coloured by type: Sheets' green, Docs' blue.
        const iconColor = (name: string) =>
            inviteRows.filter({ hasText: name }).element().querySelector('svg')?.style.getPropertyValue('--icon-color');
        expect(iconColor('Launch checklist')).toBe('#21B263');
        expect(iconColor('Meeting notes')).toBe('#4695F3');
    });

    it('accepts an invitation and opens its document in a new tab, then reloads the recents', async () => {
        const { open, assign } = stubBlankTab();
        const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
        const acceptInvitation = vi.fn(async () => {});
        const reportTelemetry = vi.fn();
        const dependencies = {
            ...recentsDependencies([]),
            ...invitationsDependencies([launchChecklist]),
            acceptInvitation,
            reportTelemetry,
            getAppHref,
        };
        const api = vi.spyOn(dependencies, 'api');
        openHomepage('/recents', dependencies);

        await userEvent.click(inviteRows.getByRole('button', { name: acceptButton }));

        await vi.waitFor(() => expect(assign).toHaveBeenCalled());
        expect(acceptInvitation).toHaveBeenCalledExactlyOnceWith(dependencies.pendingInvitations[0]);
        expect(open).toHaveBeenCalledExactlyOnceWith('', '_blank');
        expect(String(assign.mock.calls[0][0])).toBe(
            'https://proton-docs.example/sheet?mode=open&volumeId=other-volume&linkId=link-launch'
        );
        expect(reportTelemetry).toHaveBeenCalledWith('invite.accepted');

        // The accepted document reaches the recents a few seconds later: the homepage reloads them after 5 s.
        const reload = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 5000)?.[0] as () => void;
        expect(reload).toBeTypeOf('function');
        const callsBefore = api.mock.calls.length;
        reload();
        await vi.waitFor(() => expect(api.mock.calls.length).toBeGreaterThan(callsBefore));
    });

    it('hides an invitation the host reports accepted, and leaves it out of the count', async () => {
        const dependencies = invitationsDependencies([launchChecklist, meetingNotes]);
        const homepage = openHomepage('/recents', dependencies);
        await expect.element(inviteRows).toHaveLength(2);

        homepage.rerender({ ...dependencies, recentlyAcceptedInvitations: [dependencies.pendingInvitations[0]] });

        await expect.element(inviteRows).toHaveLength(1);
        await expect.element(inviteRows).toMatchTextContent('Meeting notes');
        await expect.element(invitesTable).toMatchTextContent(/Pending invitations\s*1/);
    });

    it('hides the table once every invitation is accepted, by ID even when the pending list has new objects', async () => {
        const dependencies = invitationsDependencies([launchChecklist]);
        const homepage = openHomepage('/recents', dependencies);
        await expect.element(inviteRows).toHaveLength(1);

        // The host's store gives the still-pending invitation a new object once it locks or refetches it.
        homepage.rerender({
            pendingInvitations: invitationsDependencies([launchChecklist]).pendingInvitations,
            recentlyAcceptedInvitations: dependencies.pendingInvitations,
        });

        await expect.element(invitesTable).not.toBeInTheDocument();
    });

    it('keeps an invitation and reports the error when accepting it fails', async () => {
        const { open } = stubBlankTab();
        const traceError = vi.fn();
        const error = new Error('Accept failed');
        openHomepage('/recents', {
            ...invitationsDependencies([launchChecklist]),
            acceptInvitation: async () => {
                throw error;
            },
            errorTracking: { traceError, addBreadcrumb: () => {}, isReportable: () => true },
            logger: { ...console, error: vi.fn() },
            getAppHref,
        });

        await userEvent.click(inviteRows.getByRole('button', { name: acceptButton }));

        await vi.waitFor(() => expect(traceError).toHaveBeenCalledWith(error));
        expect(open).not.toHaveBeenCalled();
        await expect.element(inviteRows).toMatchTextContent('Launch checklist');
        await expect.element(inviteRows.getByRole('button', { name: acceptButton })).toBeEnabled();
    });

    it('declines an invitation', async () => {
        const declineInvitation = vi.fn(async () => {});
        const reportTelemetry = vi.fn();
        const dependencies = { ...invitationsDependencies([launchChecklist]), declineInvitation, reportTelemetry };
        openHomepage('/recents', dependencies);

        await userEvent.click(inviteRows.getByRole('button', { name: declineButton }));

        await vi.waitFor(() =>
            expect(declineInvitation).toHaveBeenCalledExactlyOnceWith(dependencies.pendingInvitations[0])
        );
        expect(reportTelemetry).toHaveBeenCalledWith('invite.rejected');
    });

    it('disables both buttons of a locked invitation', async () => {
        const { pendingInvitations } = invitationsDependencies([launchChecklist]);
        openHomepage('/recents', { pendingInvitations: [{ ...pendingInvitations[0], isLocked: true }] });

        await expect.element(inviteRows.getByRole('button', { name: acceptButton })).toBeDisabled();
        await expect.element(inviteRows.getByRole('button', { name: declineButton })).toBeDisabled();
    });

    it('shows three of five invitations, then all of them, and collapses them again', async () => {
        openHomepage('/recents', invitationsDependencies(manyInvitations(5)));

        await expect.element(inviteRows).toHaveLength(3);
        await expect.element(invitesTable).toMatchTextContent(/Pending invitations\s*5/);

        await userEvent.click(page.getByRole('button', { name: 'View all 5 invitations' }));

        await expect.element(inviteRows).toHaveLength(5);
        await expect.element(inviteRows.nth(4)).toMatchTextContent('Invitation 5');

        await userEvent.click(page.getByRole('button', { name: 'Collapse list of pending invitations' }));

        await expect.element(inviteRows).toHaveLength(3);
        await expect.element(page.getByRole('button', { name: 'View all 5 invitations' })).toBeVisible();
    });

    it('shows no collapse controls for three invitations', async () => {
        openHomepage('/recents', invitationsDependencies(manyInvitations(3)));

        await expect.element(inviteRows).toHaveLength(3);
        await expect.element(page.getByRole('button', { name: /View/ })).not.toBeInTheDocument();
        await expect
            .element(page.getByRole('button', { name: 'Collapse list of pending invitations' }))
            .not.toBeInTheDocument();
    });

    it('shows the invitations above the recents, and not in the trash or a search', async () => {
        openHomepage('/recents', { ...recentsDependencies([budget]), ...invitationsDependencies([launchChecklist]) });
        await expect.element(inviteRows).toHaveLength(1);
        await expect.element(documentsTable).toBeVisible();

        await userEvent.fill(page.getByRole('textbox', { name: 'Search recents' }), 'Bud');
        await expect.element(documentsTable).toMatchTextContent('Search results');
        await expect.element(invitesTable).not.toBeInTheDocument();

        await userEvent.click(sidebar.getByRole('link', { name: 'Trash' }));
        await expect.element(page.getByText('There are no documents in the trash.')).toBeVisible();
        await expect.element(invitesTable).not.toBeInTheDocument();
    });

    it('shows the invitations above the empty recents', async () => {
        openHomepage('/recents', invitationsDependencies([launchChecklist]));

        await expect.element(inviteRows).toHaveLength(1);
        await expect.element(page.getByText('Create end-to-end encrypted documents and spreadsheets.')).toBeVisible();
    });
});

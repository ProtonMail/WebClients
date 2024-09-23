import { act } from 'react-dom/test-utils';

import { fireEvent, getAllByText, screen } from '@testing-library/react';
import { addDays } from 'date-fns';
import type { Location } from 'history';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/test';
import useEventManager from '@proton/components/hooks/useEventManager';
import { conversationCountsActions } from '@proton/mail';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { Label } from '@proton/shared/lib/interfaces';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import range from '@proton/utils/range';

import type { ContextState } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { assertFocus, clearAll, getDropdown, minimalCache, render } from '../../helpers/test/helper';
import { SYSTEM_FOLDER_SECTION } from '../../hooks/useMoveSystemFolders';
import MailSidebar from './MailSidebar';

jest.mock('../../../../CHANGELOG.md', () => 'ProtonMail Changelog');

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider', () => ({
    __esModule: true,
    useGetStartedChecklist: jest.fn(),
    default: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('../../containers/onboardingChecklist/provider/GetStartedChecklistProvider');
const mockedReturn = useGetStartedChecklist as jest.MockedFunction<any>;

loudRejection();

const labelID = 'labelID';

const props = {
    labelID,
    location: {} as Location,
    onToggleExpand: jest.fn(),
};

const folder = { ID: 'folder1', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder1' } as Folder;
const subfolder = { ID: 'folder2', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder2', ParentID: folder.ID } as Folder;
const label = { ID: 'label1', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label1' } as Label;
const systemFolders = [
    {
        ID: MAILBOX_LABEL_IDS.INBOX,
        Name: 'inbox',
        Path: 'inbox',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        ID: MAILBOX_LABEL_IDS.SCHEDULED,
        Name: 'all scheduled',
        Path: 'all scheduled',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 3,
        Display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        ID: MAILBOX_LABEL_IDS.DRAFTS,
        Name: 'drafts',
        Path: 'drafts',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 4,
        Display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        ID: MAILBOX_LABEL_IDS.SENT,
        Name: 'sent',
        Path: 'sent',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 5,
        Display: SYSTEM_FOLDER_SECTION.MAIN,
    },
    {
        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
        Name: 'all mail',
        Path: 'all mail',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 11,
        Display: SYSTEM_FOLDER_SECTION.MAIN,
    },
] as Label[];
const inboxMessages = { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 3, Total: 20 };
const allMailMessages = { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 10000, Total: 10001 };
const scheduledMessages = { LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Unread: 1, Total: 4 };
const folderMessages = { LabelID: folder.ID, Unread: 1, Total: 2 };
const labelMessages = { LabelID: label.ID, Unread: 2, Total: 3 };

const setupTest = () => {
    // open the more section otherwise it's closed by default
    setItem('item-display-more-items', 'true');

    minimalCache();

    mockedReturn.mockReturnValue({
        displayState: CHECKLIST_DISPLAY_TYPE.FULL,
        items: new Set(),
    } as ContextState);
};

describe('MailSidebar', () => {
    const setup = async () => {
        minimalCache();
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as ContextState);

        const result = await render(<MailSidebar {...props} />);

        return { ...result };
    };

    afterEach(() => {
        clearAll();
        // We need to remove the item from the localStorage otherwise it will keep the previous state
        removeItem('item-display-folders');
        removeItem('item-display-labels');
    });

    it('should redirect on inbox when click on logo', async () => {
        const { getByTestId, history } = await setup();
        const logo = getByTestId('main-logo') as HTMLAnchorElement;
        fireEvent.click(logo);

        expect(history.length).toBe(1);
        expect(history.location.pathname).toBe('/inbox');
    });

    it('should open app dropdown', async () => {
        const { getByTitle } = await setup();

        const appsButton = getByTitle('Proton applications');
        fireEvent.click(appsButton);

        const dropdown = await getDropdown();

        getAllByText(dropdown, 'Proton Mail');
        getAllByText(dropdown, 'Proton Calendar');
        getAllByText(dropdown, 'Proton Drive');
        getAllByText(dropdown, 'Proton VPN');
    });

    it('should show folder tree', async () => {
        setupTest();

        const { getByTestId, queryByTestId } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder, subfolder]),
            },
        });

        const folderElement = getByTestId(`navigation-link:${folder.ID}`);
        const folderIcon = folderElement.querySelector('svg:not(.navigation-icon--expand)');

        expect(folderElement.textContent).toContain(folder.Name);
        expect((folderIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-folders');

        const subfolderElement = getByTestId(`navigation-link:${subfolder.ID}`);
        const subfolderIcon = subfolderElement.querySelector('svg');

        expect(subfolderElement.textContent).toContain(subfolder.Name);
        expect((subfolderIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-folder');

        const collapseButton = folderElement.querySelector('button');

        if (collapseButton) {
            fireEvent.click(collapseButton);
        }

        expect(queryByTestId(`sidebar-item-${subfolder.ID}`)).toBeNull();
    });

    it('should show label list', async () => {
        setupTest();

        const { getByTestId } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([label]),
            },
        });

        const labelElement = getByTestId(`navigation-link:${label.ID}`);
        const labelIcon = labelElement.querySelector('svg');

        expect(labelElement.textContent).toContain(label.Name);
        expect((labelIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-circle-filled');
    });

    it('should show unread counters', async () => {
        setupTest();

        const { getByTestId } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder, label, ...systemFolders]),
                conversationCounts: getModelState([inboxMessages, allMailMessages, folderMessages, labelMessages]),
            },
        });

        const inboxElement = getByTestId(`navigation-link:inbox`);
        const allMailElement = getByTestId(`navigation-link:all-mail`);
        const folderElement = getByTestId(`navigation-link:${folder.ID}`);
        const labelElement = getByTestId(`navigation-link:${label.ID}`);

        const inBoxLocationAside = inboxElement.querySelector('.navigation-counter-item');
        const allMailLocationAside = allMailElement.querySelector('.navigation-counter-item');
        const folderLocationAside = folderElement.querySelector('.navigation-counter-item');
        const labelLocationAside = labelElement.querySelector('.navigation-counter-item');

        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessages.Unread}`);
        expect(allMailLocationAside?.innerHTML).toBe('9999+');
        expect(folderLocationAside?.innerHTML).toBe(`${folderMessages.Unread}`);
        expect(labelLocationAside?.innerHTML).toBe(`${labelMessages.Unread}`);
    });

    it('should navigate to the label on click', async () => {
        setupTest();

        const { getByTestId, history } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder]),
            },
        });

        const folderElement = getByTestId(`navigation-link:${folder.ID}`);

        expect(history.location.pathname).toBe('/inbox');

        act(() => {
            fireEvent.click(folderElement);
        });

        expect(history.location.pathname).toBe(`/${folder.ID}`);
    });

    it('should call event manager on click if already on label', async () => {
        setupTest();

        const { getByTestId, history } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder]),
            },
        });

        const folderElement = getByTestId(`navigation-link:${folder.ID}`);

        // Click on the label to be redirected in it
        act(() => {
            fireEvent.click(folderElement);
        });

        // Check if we are in the label
        expect(history.location.pathname).toBe(`/${folder.ID}`);

        // Click again on the label to trigger the event manager
        act(() => {
            fireEvent.click(folderElement);
        });

        expect(useEventManager.call).toHaveBeenCalled();
    });

    it('should be updated when counters are updated', async () => {
        setupTest();

        const { getByTestId, store } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([inboxMessages]),
            },
        });

        const inboxElement = getByTestId('navigation-link:inbox');

        const inBoxLocationAside = inboxElement.querySelector('.navigation-counter-item');
        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessages.Unread}`);

        const inboxMessagesUpdated = { LabelID: '0', Unread: 7, Total: 21 };

        act(() => {
            store.dispatch(conversationCountsActions.set([inboxMessagesUpdated]));
        });

        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessagesUpdated.Unread}`);
    });

    it('should not show scheduled sidebar item when feature flag is disabled', async () => {
        setupTest();

        const { queryByTestId } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([scheduledMessages]),
            },
        });

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });

    it('should show scheduled sidebar item if scheduled messages', async () => {
        setupTest();

        const { getByTestId } = await render(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([scheduledMessages]),
            },
        });

        const scheduledLocationAside = getByTestId(`navigation-link:unread-count`);

        // We have two navigation counters for scheduled messages, one to display the number of scheduled messages and one for unread scheduled messages
        expect(scheduledLocationAside.innerHTML).toBe(`${scheduledMessages.Total}`);
    });

    it('should not show scheduled sidebar item without scheduled messages', async () => {
        setupTest();

        const { queryByTestId } = await render(<MailSidebar {...props} />);

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });

    describe('Sidebar hotkeys', () => {
        it('should navigate with the arrow keys', async () => {
            setupTest();

            const { getByTestId, getByTitle, container } = await render(<MailSidebar {...props} />, {
                preloadedState: {
                    categories: getModelState([label, folder, ...systemFolders]),
                },
            });

            const sidebar = container.querySelector('nav > div') as HTMLDivElement;
            const More = getByTitle('Less'); // When opened, it becomes "LESS"
            const Folders = getByTitle('Folders');
            const Labels = getByTitle('Labels');

            const Inbox = getByTestId('navigation-link:inbox');
            const Drafts = getByTestId('navigation-link:drafts');
            const Folder = getByTestId(`navigation-link:${folder.ID}`);
            const Label = getByTestId(`navigation-link:${label.ID}`);

            const down = () => fireEvent.keyDown(sidebar, { key: 'ArrowDown' });
            const up = () => fireEvent.keyDown(sidebar, { key: 'ArrowUp' });
            const ctrlDown = () => fireEvent.keyDown(sidebar, { key: 'ArrowDown', ctrlKey: true });
            const ctrlUp = () => fireEvent.keyDown(sidebar, { key: 'ArrowUp', ctrlKey: true });

            down();
            assertFocus(Inbox);
            down();
            assertFocus(Drafts);
            range(0, 3).forEach(down);
            assertFocus(More);
            down();
            assertFocus(Folders);
            down();
            assertFocus(Folder);
            down();
            assertFocus(Labels);
            down();
            assertFocus(Label);

            up();
            assertFocus(Labels);
            up();
            assertFocus(Folder);
            up();
            assertFocus(Folders);
            range(0, 10).forEach(up);
            assertFocus(Inbox);

            ctrlDown();
            assertFocus(Label);
            ctrlUp();
            assertFocus(Inbox);
        });

        it('should navigate to list with right key', async () => {
            setupTest();

            const TestComponent = () => {
                return (
                    <>
                        <MailSidebar {...props} />
                        <div data-shortcut-target="item-container" tabIndex={-1}>
                            test
                        </div>
                    </>
                );
            };

            const { container } = await render(<TestComponent />, {
                preloadedState: {
                    categories: getModelState([label, folder]),
                },
            });

            const sidebar = container.querySelector('nav > div') as HTMLDivElement;

            fireEvent.keyDown(sidebar, { key: 'ArrowRight' });

            const target = document.querySelector('[data-shortcut-target="item-container"]');

            assertFocus(target);
        });
    });
});

describe('Sidebar checklist display', () => {
    beforeEach(() => {
        minimalCache();
    });

    it('Should display the checklist if state is reduced', async () => {
        mockedReturn.mockReturnValue({
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
        } as ContextState);

        const { container } = await render(<MailSidebar {...props} />);
        screen.getByTestId('onboarding-checklist');

        const nav = container.querySelector('nav');
        expect(nav?.childNodes.length).toEqual(4);
    });

    it('Should not display the checklist if state is full', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as ContextState);

        const { container } = await render(<MailSidebar {...props} />);
        const checklistWrapper = screen.queryByTestId('onboarding-checklist');
        const nav = container.querySelector('nav');

        expect(checklistWrapper).toBeNull();
        expect(nav?.childNodes.length).toEqual(3);
    });

    it('Should not display the checklist if state is hidden', async () => {
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.HIDDEN,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as ContextState);

        const { container } = await render(<MailSidebar {...props} />);
        const checklistWrapper = screen.queryByTestId('onboarding-checklist');
        const nav = container.querySelector('nav');

        expect(checklistWrapper).toBeNull();
        expect(nav?.childNodes.length).toEqual(3);
    });

    it('Should hide the checklist when pressing the cross button in the sidebar', async () => {
        const mockedChangeDisplay = jest.fn();
        mockedReturn.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
            changeChecklistDisplay: mockedChangeDisplay,
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as Partial<ContextState>);

        const { container } = await render(<MailSidebar {...props} />);

        const nav = container.querySelector('nav');
        expect(nav?.childNodes.length).toEqual(4);

        const closeButton = screen.getByTestId('onboarding-checklist-header-hide-button');
        fireEvent.click(closeButton);
        expect(mockedChangeDisplay).toHaveBeenCalledWith(CHECKLIST_DISPLAY_TYPE.HIDDEN);
    });
});

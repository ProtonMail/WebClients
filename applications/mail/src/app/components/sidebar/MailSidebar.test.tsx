import { act } from 'react-dom/test-utils';

import { fireEvent } from '@testing-library/dom';
import { Location } from 'history';
import loudRejection from 'loud-rejection';

import { getAppVersion } from '@proton/components';
import useEventManager from '@proton/components/hooks/useEventManager';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import range from '@proton/utils/range';

import {
    addToCache,
    assertFocus,
    clearAll,
    config,
    getHistory,
    minimalCache,
    render,
    setFeatureFlags,
} from '../../helpers/test/helper';
import { SYSTEM_FOLDER_SECTION } from '../../hooks/useMoveSystemFolders';
import MailSidebar from './MailSidebar';

jest.mock('../../../../CHANGELOG.md', () => 'ProtonMail Changelog');

loudRejection();

const labelID = 'labelID';

const props = {
    labelID,
    location: {} as Location,
    onToggleExpand: jest.fn(),
};

const folder = { ID: 'folder1', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder1' };
const subfolder = { ID: 'folder2', Type: LABEL_TYPE.MESSAGE_FOLDER, Name: 'folder2', ParentID: folder.ID };
const label = { ID: 'label1', Type: LABEL_TYPE.MESSAGE_LABEL, Name: 'label1' };
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
];
const inboxMessages = { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 3, Total: 20 };
const allMailMessages = { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 10000, Total: 10001 };
const scheduledMessages = { LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Unread: 1, Total: 4 };
const folderMessages = { LabelID: folder.ID, Unread: 1, Total: 2 };
const labelMessages = { LabelID: label.ID, Unread: 2, Total: 3 };

const setupTest = (labels: any[] = [], messageCounts: any[] = [], conversationCounts: any[] = []) => {
    // open the more section otherwise it's closed by default
    setItem('item-display-more-items', 'true');

    minimalCache();
    addToCache('Labels', labels);
    addToCache('MessageCounts', messageCounts);
    addToCache('ConversationCounts', conversationCounts);
};

const setupScheduled = () => {
    setFeatureFlags('ScheduledSend', true);
};

describe('MailSidebar', () => {
    afterEach(() => {
        clearAll();
        // We need to remove the item from the localStorage otherwise it will keep the previous state
        removeItem('item-display-folders');
        removeItem('item-display-labels');
    });

    it('should show folder tree', async () => {
        setupTest([folder, subfolder]);

        const { getByTestId, queryByTestId } = await render(<MailSidebar {...props} />, false);

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
        setupTest([label]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const labelElement = getByTestId(`navigation-link:${label.ID}`);
        const labelIcon = labelElement.querySelector('svg');

        expect(labelElement.textContent).toContain(label.Name);
        expect((labelIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-circle-filled');
    });

    it('should show unread counters', async () => {
        setupTest(
            [folder, label, ...systemFolders],
            [],
            [inboxMessages, allMailMessages, folderMessages, labelMessages]
        );

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

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
        setupTest([folder]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const folderElement = getByTestId(`navigation-link:${folder.ID}`);

        const history = getHistory();

        expect(history.location.pathname).toBe('/inbox');

        act(() => {
            fireEvent.click(folderElement);
        });

        expect(history.location.pathname).toBe(`/${folder.ID}`);
    });

    it('should call event manager on click if already on label', async () => {
        setupTest([folder]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const folderElement = getByTestId(`navigation-link:${folder.ID}`);

        // Click on the label to be redirected in it
        act(() => {
            fireEvent.click(folderElement);
        });

        // Check if we are in the label
        expect(getHistory().location.pathname).toBe(`/${folder.ID}`);

        // Click again on the label to trigger the event manager
        act(() => {
            fireEvent.click(folderElement);
        });

        expect(useEventManager.call).toHaveBeenCalled();
    });

    it('should show app version and changelog', async () => {
        setupTest();

        const { getByText } = await render(<MailSidebar {...props} />, false);
        const appVersion = getAppVersion(config.APP_VERSION);

        const appVersionButton = getByText(appVersion);

        // Check if the changelog modal opens on click
        fireEvent.click(appVersionButton);

        getByText("What's new");
        getByText('ProtonMail Changelog');
    });

    it('should be updated when counters are updated', async () => {
        setupTest(systemFolders, [], [inboxMessages]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const inboxElement = getByTestId('navigation-link:inbox');

        const inBoxLocationAside = inboxElement.querySelector('.navigation-counter-item');
        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessages.Unread}`);

        const inboxMessagesUpdated = { LabelID: '0', Unread: 7, Total: 21 };

        act(() => {
            addToCache('ConversationCounts', [inboxMessagesUpdated]);
        });

        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessagesUpdated.Unread}`);
    });

    it('should not show scheduled sidebar item when feature flag is disabled', async () => {
        setupTest(systemFolders, [], [scheduledMessages]);

        const { queryByTestId } = await render(<MailSidebar {...props} />, false);

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });

    it('should show scheduled sidebar item if scheduled messages', async () => {
        setupTest(systemFolders, [], [scheduledMessages]);
        setupScheduled();

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const scheduledLocationAside = getByTestId(`navigation-link:unread-count`);

        // We have two navigation counters for scheduled messages, one to display the number of scheduled messages and one for unread scheduled messages
        expect(scheduledLocationAside.innerHTML).toBe(`${scheduledMessages.Total}`);
    });

    it('should not show scheduled sidebar item without scheduled messages', async () => {
        setupTest([], [], []);
        setupScheduled();

        const { queryByTestId } = await render(<MailSidebar {...props} />, false);

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });

    describe('Sidebar hotkeys', () => {
        it('should navigate with the arrow keys', async () => {
            setupTest([label, folder, ...systemFolders]);

            const { getByTestId, getByTitle, container } = await render(<MailSidebar {...props} />, false);

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
            range(0, 5).forEach(down);

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
            setupTest([label, folder]);

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

            const { container } = await render(<TestComponent />, false);

            const sidebar = container.querySelector('nav > div') as HTMLDivElement;

            fireEvent.keyDown(sidebar, { key: 'ArrowRight' });

            const target = document.querySelector('[data-shortcut-target="item-container"]');

            assertFocus(target);
        });
    });
});

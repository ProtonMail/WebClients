import { Location } from 'history';
import { fireEvent } from '@testing-library/dom';
import { act } from 'react-dom/test-utils';
import { getAppVersion } from '@proton/components';
import useEventManager from '@proton/components/hooks/useEventManager';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import loudRejection from 'loud-rejection';
import {
    render,
    clearAll,
    addToCache,
    minimalCache,
    config,
    getHistory,
    setFeatureFlags,
} from '../../helpers/test/helper';
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
const inboxMessages = { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 3, Total: 20 };
const allMailMessages = { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 10000, Total: 10001 };
const scheduledMessages = { LabelID: MAILBOX_LABEL_IDS.SCHEDULED, Unread: 1, Total: 4 };
const folderMessages = { LabelID: folder.ID, Unread: 1, Total: 2 };
const labelMessages = { LabelID: label.ID, Unread: 2, Total: 3 };

const setupTest = (labels: any[] = [], messageCounts: any[] = [], conversationCounts: any[] = []) => {
    minimalCache();
    addToCache('Labels', labels);
    addToCache('MessageCounts', messageCounts);
    addToCache('ConversationCounts', conversationCounts);
};

const setupScheduled = () => {
    setFeatureFlags('ScheduledSend', true);
};

describe('MailSidebar', () => {
    afterEach(clearAll);

    it('should show folder tree', async () => {
        setupTest([folder, subfolder]);

        const { getByTestId, queryByTestId } = await render(<MailSidebar {...props} />, false);

        const folderElement = getByTestId(`navigation-link:${folder.Name}`);
        const folderIcon = folderElement.querySelector('svg');

        expect(folderElement.textContent).toContain(folder.Name);
        expect((folderIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-folders');

        const subfolderElement = getByTestId(`navigation-link:${subfolder.Name}`);
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

        const labelElement = getByTestId(`navigation-link:${label.Name}`);
        const labelIcon = labelElement.querySelector('svg');

        expect(labelElement.textContent).toContain(label.Name);
        expect((labelIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-circle-filled');
    });

    it('should show unread counters', async () => {
        setupTest([folder, label], [], [inboxMessages, allMailMessages, folderMessages, labelMessages]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const inboxElement = getByTestId(`navigation-link:Inbox`);
        const allMailElement = getByTestId(`navigation-link:All mail`);
        const folderElement = getByTestId(`navigation-link:${folder.Name}`);
        const labelElement = getByTestId(`navigation-link:${label.Name}`);

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

        const folderElement = getByTestId(`navigation-link:${folder.Name}`);

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

        const folderElement = getByTestId(`navigation-link:${folder.Name}`);

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
        const appVersion = getAppVersion(config.APP_VERSION_DISPLAY || config.APP_VERSION);

        const appVersionButton = getByText(appVersion);

        // Check if the changelog modal opens on click
        fireEvent.click(appVersionButton);

        getByText("What's new");
        getByText('ProtonMail Changelog');
    });

    it('should be updated when counters are updated', async () => {
        setupTest([], [], [inboxMessages]);

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const inboxElement = getByTestId('navigation-link:Inbox');

        const inBoxLocationAside = inboxElement.querySelector('.navigation-counter-item');
        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessages.Unread}`);

        const inboxMessagesUpdated = { LabelID: '0', Unread: 7, Total: 21 };

        act(() => {
            addToCache('ConversationCounts', [inboxMessagesUpdated]);
        });

        expect(inBoxLocationAside?.innerHTML).toBe(`${inboxMessagesUpdated.Unread}`);
    });

    it('should not show scheduled sidebar item when feature flag is disabled', async () => {
        setupTest([], [], [scheduledMessages]);

        const { queryByTestId } = await render(<MailSidebar {...props} />, false);

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });

    it('should show scheduled sidebar item if scheduled messages', async () => {
        setupTest([], [], [scheduledMessages]);
        setupScheduled();

        const { getByTestId } = await render(<MailSidebar {...props} />, false);

        const scheduledElement = getByTestId(`navigation-link:Scheduled`);

        const scheduledLocationAside = scheduledElement.querySelectorAll('.navigation-counter-item');

        // We have two navigation counters for scheduled messages, one to display the number of scheduled messages and one for unread scheduled messages
        expect(scheduledLocationAside[0]?.innerHTML).toBe(`${scheduledMessages.Total}`);
        expect(scheduledLocationAside[1]?.innerHTML).toBe(`${scheduledMessages.Unread}`);
    });

    it('should not show scheduled sidebar item without scheduled messages', async () => {
        setupTest([], [], []);
        setupScheduled();

        const { queryByTestId } = await render(<MailSidebar {...props} />, false);

        expect(queryByTestId(`Scheduled`)).toBeNull();
    });
});

import { act, fireEvent, getAllByText, screen } from '@testing-library/react';
import { addDays, subDays } from 'date-fns';
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

import type { OnboardingChecklistContext } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import * as GetStartedChecklistProviderModule from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { assertFocus, clearAll, getDropdown, mailTestRender, minimalCache } from '../../helpers/test/helper';
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

describe('MailSidebar', () => {
    let mockedUseGetStartedChecklist: jest.SpyInstance<OnboardingChecklistContext, [], any>;

    beforeEach(() => {
        mockedUseGetStartedChecklist = jest.spyOn(GetStartedChecklistProviderModule, 'useGetStartedChecklist');
    });

    const setupTest = () => {
        // open the more section otherwise it's closed by default
        setItem('item-display-more-items', 'true');

        minimalCache();

        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as OnboardingChecklistContext);
    };

    const setup = async () => {
        minimalCache();
        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
        } as OnboardingChecklistContext);

        const view = await mailTestRender(<MailSidebar {...props} />);

        return { ...view };
    };

    afterEach(() => {
        clearAll();
        // We need to remove the item from the localStorage otherwise it will keep the previous state
        removeItem('item-display-folders');
        removeItem('item-display-labels');
    });

    it('should redirect on inbox when click on logo', async () => {
        const { history } = await setup();
        const logo = screen.getByTestId('main-logo') as HTMLAnchorElement;
        fireEvent.click(logo);

        expect(history.length).toBe(1);
        expect(history.location.pathname).toBe('/inbox');
    });

    it('should open app dropdown', async () => {
        await setup();

        const appsButton = screen.getByTitle('Proton applications');
        fireEvent.click(appsButton);

        const dropdown = await getDropdown();

        getAllByText(dropdown, 'Proton Mail');
        getAllByText(dropdown, 'Proton Calendar');
        getAllByText(dropdown, 'Proton Drive');
        getAllByText(dropdown, 'Proton VPN');
    });

    it('should show folder tree', async () => {
        setupTest();

        await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder, subfolder]),
            },
        });

        const folderElement = screen.getByTestId(`navigation-link:${folder.ID}`);
        const folderIcon = folderElement.querySelector('svg:not(.navigation-icon--expand)');

        expect(folderElement.textContent).toContain(folder.Name);
        expect((folderIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-folders');

        const subfolderElement = screen.getByTestId(`navigation-link:${subfolder.ID}`);
        const subfolderIcon = subfolderElement.querySelector('svg');

        expect(subfolderElement.textContent).toContain(subfolder.Name);
        expect((subfolderIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-folder');

        const collapseButton = folderElement.querySelector('button');

        if (collapseButton) {
            fireEvent.click(collapseButton);
        }

        expect(screen.queryByTestId(`sidebar-item-${subfolder.ID}`)).toBeNull();
    });

    it('should show label list', async () => {
        setupTest();

        await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([label]),
            },
        });

        const labelElement = screen.getByTestId(`navigation-link:${label.ID}`);
        const labelIcon = labelElement.querySelector('svg');

        expect(labelElement.textContent).toContain(label.Name);
        expect((labelIcon?.firstChild as Element).getAttribute('xlink:href')).toBe('#ic-circle-filled');
    });

    it('should show unread counters', async () => {
        setupTest();

        await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder, label, ...systemFolders]),
                conversationCounts: getModelState([inboxMessages, allMailMessages, folderMessages, labelMessages]),
            },
        });

        const inboxElement = screen.getByTestId(`navigation-link:inbox`);
        const allMailElement = screen.getByTestId(`navigation-link:all-mail`);
        const folderElement = screen.getByTestId(`navigation-link:${folder.ID}`);
        const labelElement = screen.getByTestId(`navigation-link:${label.ID}`);

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

        const { history } = await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder]),
            },
        });

        const folderElement = screen.getByTestId(`navigation-link:${folder.ID}`);

        expect(history.location.pathname).toBe('/inbox');

        fireEvent.click(folderElement);

        expect(history.location.pathname).toBe(`/${folder.ID}`);
    });

    it('should navigate to the inbox folder and set it as active', async () => {
        setupTest();

        const { history } = await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([...systemFolders]),
            },
        });

        const folderElement = screen.getByTestId(`navigation-link:drafts`);
        const inboxFolderElement = screen.getByTestId(`navigation-link:inbox`);

        expect(history.location.pathname).toBe('/inbox');

        fireEvent.click(folderElement);

        expect(history.location.pathname).toBe(`/drafts`);

        fireEvent.click(inboxFolderElement);

        expect(inboxFolderElement).toHaveClass('navigation-link active');

        expect(history.location.pathname).toBe('/inbox');
    });

    it('should call event manager on click if already on label', async () => {
        setupTest();

        const { history } = await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState([folder]),
            },
        });

        const folderElement = screen.getByTestId(`navigation-link:${folder.ID}`);

        // Click on the label to be redirected in it
        fireEvent.click(folderElement);

        // Check if we are in the label
        expect(history.location.pathname).toBe(`/${folder.ID}`);

        // Click again on the label to trigger the event manager
        fireEvent.click(folderElement);

        expect(useEventManager.call).toHaveBeenCalled();
    });

    it('should be updated when counters are updated', async () => {
        setupTest();

        const { store } = await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([inboxMessages]),
            },
        });

        const inboxElement = screen.getByTestId('navigation-link:inbox');

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

        await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([scheduledMessages]),
            },
        });

        expect(screen.queryByTestId(`Scheduled`)).toBeNull();
    });

    it('should show scheduled sidebar item if scheduled messages', async () => {
        setupTest();

        await mailTestRender(<MailSidebar {...props} />, {
            preloadedState: {
                categories: getModelState(systemFolders),
                conversationCounts: getModelState([scheduledMessages]),
            },
        });

        const scheduledLocationAside = screen.getByTestId(`navigation-link:unread-count`);

        // We have two navigation counters for scheduled messages, one to display the number of scheduled messages and one for unread scheduled messages
        expect(scheduledLocationAside.innerHTML).toBe(`${scheduledMessages.Total}`);
    });

    it('should not show scheduled sidebar item without scheduled messages', async () => {
        setupTest();

        await mailTestRender(<MailSidebar {...props} />);
        expect(screen.queryByTestId(`Scheduled`)).toBeNull();
    });

    describe('Sidebar hotkeys', () => {
        it('should navigate with the arrow keys', async () => {
            setupTest();

            const { container } = await mailTestRender(<MailSidebar {...props} />, {
                preloadedState: {
                    categories: getModelState([label, folder, ...systemFolders]),
                },
            });

            const sidebar = container.querySelector('nav > div') as HTMLDivElement;
            const More = screen.getByTitle('Less'); // When opened, it becomes "LESS"
            const Folders = screen.getByTitle('Folders');
            const Labels = screen.getByTitle('Labels');

            const Inbox = screen.getByTestId('navigation-link:inbox');
            const Drafts = screen.getByTestId('navigation-link:drafts');
            const Folder = screen.getByTestId(`navigation-link:${folder.ID}`);
            const Label = screen.getByTestId(`navigation-link:${label.ID}`);

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

            const { container } = await mailTestRender(<TestComponent />, {
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
    let mockedUseGetStartedChecklist: jest.SpyInstance<OnboardingChecklistContext, [], any>;

    beforeEach(() => {
        minimalCache();
        mockedUseGetStartedChecklist = jest.spyOn(GetStartedChecklistProviderModule, 'useGetStartedChecklist');
    });

    it('Should display the checklist if state is reduced', async () => {
        mockedUseGetStartedChecklist.mockReturnValue({
            createdAt: new Date(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
        } as OnboardingChecklistContext);

        await mailTestRender(<MailSidebar {...props} />);
        screen.getByTestId('onboarding-checklist');
    });

    it('Should not display the checklist if state is full', async () => {
        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.FULL,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as OnboardingChecklistContext);

        await mailTestRender(<MailSidebar {...props} />);
        const checklistWrapper = screen.queryByTestId('onboarding-checklist');

        expect(checklistWrapper).toBeNull();
    });

    it('Should not display the checklist if state is hidden', async () => {
        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.HIDDEN,
            items: new Set(),
            expiresAt: addDays(new Date(), 10),
            canDisplayChecklist: true,
        } as OnboardingChecklistContext);

        await mailTestRender(<MailSidebar {...props} />);
        const checklistWrapper = screen.queryByTestId('onboarding-checklist');

        expect(checklistWrapper).toBeNull();
    });

    it('Should hide the checklist when pressing the cross button in the sidebar', async () => {
        jest.useFakeTimers().setSystemTime(new Date('2024-12-01'));

        const mockedChangeDisplay = jest.fn();
        const nowDate = new Date();

        mockedUseGetStartedChecklist.mockReturnValue({
            displayState: CHECKLIST_DISPLAY_TYPE.REDUCED,
            items: new Set(),
            changeChecklistDisplay: mockedChangeDisplay,
            createdAt: subDays(nowDate, 19),
            // List should be expired
            expiresAt: subDays(nowDate, 1),
            canDisplayChecklist: true,
            isChecklistFinished: false,
            isUserPaid: false,
            loading: false,
            markItemsAsDone: jest.fn(),
            userWasRewarded: false,
            daysBeforeExpire: 0,
            hasExpired: true,
        } as OnboardingChecklistContext);

        await mailTestRender(<MailSidebar {...props} />);

        const closeButton = screen.getByTestId('onboarding-checklist-header-hide-button');
        fireEvent.click(closeButton);
        expect(mockedChangeDisplay).toHaveBeenCalledWith(CHECKLIST_DISPLAY_TYPE.HIDDEN);

        jest.clearAllTimers();
    });
});

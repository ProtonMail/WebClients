import { act, fireEvent, getByTestId as getByTestIdDefault, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/tests';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Label } from '@proton/shared/lib/interfaces';

import { addApiMock } from '../../../helpers/tests/api';
import { minimalCache } from '../../../helpers/tests/cache';
import { mailTestRender } from '../../../helpers/tests/render';
import * as mailboxActions from '../../../store/mailbox/mailboxActions';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import { mockActiveCategoriesData } from '../../categoryView/testUtils/helpers';
import { messageID } from '../../message/tests/Message.test.helpers';
import MoveDropdown from '../MoveDropdown';

jest.mock('../../../store/mailbox/mailboxActions', () => {
    const actual = jest.requireActual('../../../store/mailbox/mailboxActions');
    return {
        ...actual,
        labelMessages: Object.assign(jest.fn(actual.labelMessages), actual.labelMessages),
    };
});

jest.mock('../../categoryView/useCategoriesView', () => ({
    useCategoriesView: jest.fn(() => ({
        shouldShowTabs: false,
        activeCategoriesTabs: [],
    })),
}));

const mockedUseCategoriesView = jest.requireMock('../../categoryView/useCategoriesView').useCategoriesView;

const folder1Name = 'Folder1';
const folder1ID = 'folder-1-id';
const folder2Name = 'Folder2';
const folder2ID = 'folder-2-id';

const search = 'This label does not exists';

const props = {
    selectedIDs: [messageID],
    labelID: MAILBOX_LABEL_IDS.INBOX,
    onClose: jest.fn(),
    onLock: jest.fn(),
};

const getMessage = (labelIDs: string[] = []) => {
    return {
        localID: messageID,
        data: {
            Sender: { Address: 'sender@sender.pm.me' },
            ConversationID: 'conversationID',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, ...labelIDs],
        },
    } as MessageState;
};

describe('MoveDropdown', () => {
    beforeEach(() => {
        mockedUseCategoriesView.mockReturnValue({
            shouldShowTabs: false,
            activeCategoriesTabs: [],
        });
    });

    const setup = async (labelIDs: string[] = []) => {
        minimalCache();

        const message = getMessage(labelIDs);

        const view = await mailTestRender(<></>, {
            preloadedState: {
                categories: getModelState([
                    {
                        ID: folder1ID,
                        Name: folder1Name,
                        Color: ACCENT_COLORS[0],
                        Type: LABEL_TYPE.MESSAGE_FOLDER,
                        Path: folder1Name,
                    } as Label,
                    {
                        ID: folder2ID,
                        Name: folder2Name,
                        Color: ACCENT_COLORS[1],
                        Type: LABEL_TYPE.MESSAGE_FOLDER,
                        Path: folder2Name,
                    } as Label,
                ]),
            },
        });
        view.store.dispatch(initialize(message));
        await view.rerender(<MoveDropdown {...props} />);
        return view;
    };

    it("should display user's folders in the dropdowm", async () => {
        await setup();

        const folders = (await screen.findAllByTestId(/label-dropdown:folder-radio-/)) as HTMLInputElement[];

        // Should contain default folders (Inbox, Archive, Spam, Trash) + custom folders
        expect(folders.length).toBe(6);
        expect(folders[0].checked).toBe(false);
        expect(folders[1].checked).toBe(false);
        screen.getAllByText(folder1Name);
        screen.getAllByText(folder2Name);
    });

    it('should move to a folder', async () => {
        const labelMessagesSpy = jest.mocked(mailboxActions.labelMessages);

        await setup();

        const radio1 = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;

        // Check the first radio
        expect(radio1.checked).toBe(false);

        await act(async () => {
            fireEvent.click(radio1);
        });

        expect(radio1.checked).toBe(true);

        // Apply the label
        const applyButton = screen.getByTestId('move-dropdown:apply');

        await act(async () => {
            fireEvent.click(applyButton);
        });

        // label call has been made
        expect(labelMessagesSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                destinationLabelID: folder1ID,
            })
        );

        labelMessagesSpy.mockClear();
    });

    describe('one-click folder move', () => {
        it('should move to a folder immediately when clicking the folder name without pressing Apply', async () => {
            const labelMessagesSpy = jest.mocked(mailboxActions.labelMessages);

            await setup();

            const folderName = screen.getByTestId(`folder-dropdown:folder-${folder1Name}`);

            await act(async () => {
                fireEvent.click(folderName);
            });

            expect(labelMessagesSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    destinationLabelID: folder1ID,
                })
            );

            labelMessagesSpy.mockClear();
        });

        it('should close the dropdown immediately when clicking the folder name', async () => {
            props.onClose.mockClear();

            await setup();

            const folderName = screen.getByTestId(`folder-dropdown:folder-${folder1Name}`);

            await act(async () => {
                fireEvent.click(folderName);
            });

            expect(props.onClose).toHaveBeenCalled();
        });
    });

    it('should create a folder from the button', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label button
        const createLabelButton = screen.getByTestId('folder-dropdown:add-folder');

        fireEvent.click(createLabelButton);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });

    describe("always move sender's emails checkbox", () => {
        it('should enable the checkbox when a regular folder is selected', async () => {
            await setup();

            const radio = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(radio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            expect(checkbox.disabled).toBe(false);
        });

        it('should disable the checkbox when a category is selected as destination', async () => {
            mockedUseCategoriesView.mockReturnValue({
                shouldShowTabs: true,
                activeCategoriesTabs: mockActiveCategoriesData,
            });

            await setup();

            const categoryName = getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            const categoryRadio = screen.getByTestId(`label-dropdown:folder-radio-${categoryName}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(categoryRadio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            expect(checkbox.disabled).toBe(true);
        });

        it('should disable the checkbox when Spam is selected as destination', async () => {
            await setup();

            const spamRadio = screen.getByTestId(`label-dropdown:folder-radio-Spam`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(spamRadio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            expect(checkbox.disabled).toBe(true);
        });

        it('should untick the checkbox while the destination cannot create filters, and restore it afterwards', async () => {
            mockedUseCategoriesView.mockReturnValue({
                shouldShowTabs: true,
                activeCategoriesTabs: mockActiveCategoriesData,
            });

            await setup();

            const folderRadio = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(folderRadio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            await act(async () => {
                fireEvent.click(checkbox);
            });
            expect(checkbox.checked).toBe(true);

            // Selecting a category makes the option unavailable, so it must not appear ticked
            const categoryName = getLabelFromCategoryId(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            const categoryRadio = screen.getByTestId(`label-dropdown:folder-radio-${categoryName}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(categoryRadio);
            });
            expect(checkbox.disabled).toBe(true);
            expect(checkbox.checked).toBe(false);

            // Going back to a valid destination restores the user's choice
            await act(async () => {
                fireEvent.click(folderRadio);
            });
            expect(checkbox.disabled).toBe(false);
            expect(checkbox.checked).toBe(true);
        });

        it('should create filters when applying a ticked checkbox to a regular folder', async () => {
            const filterApiMock = jest.fn(() => ({ Filter: {} }));
            addApiMock('mail/v4/filters', filterApiMock);

            await setup();

            const folderRadio = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(folderRadio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            await act(async () => {
                fireEvent.click(checkbox);
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('move-dropdown:apply'));
            });

            expect(filterApiMock).toHaveBeenCalled();
        });

        /*
         * Spam is the destination that proves the guard: unlike a category, it is a known folder,
         * so a filter would actually be built for it if `always` was not overridden on submit.
         */
        it('should not create filters when applying a ticked checkbox to Spam', async () => {
            const filterApiMock = jest.fn(() => ({ Filter: {} }));
            addApiMock('mail/v4/filters', filterApiMock);

            await setup();

            const folderRadio = screen.getByTestId(`label-dropdown:folder-radio-${folder1Name}`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(folderRadio);
            });

            const checkbox = screen.getByTestId('move-dropdown:always-move') as HTMLInputElement;
            await act(async () => {
                fireEvent.click(checkbox);
            });
            expect(checkbox.checked).toBe(true);

            const spamRadio = screen.getByTestId(`label-dropdown:folder-radio-Spam`) as HTMLInputElement;
            await act(async () => {
                fireEvent.click(spamRadio);
            });

            await act(async () => {
                fireEvent.click(screen.getByTestId('move-dropdown:apply'));
            });

            expect(filterApiMock).not.toHaveBeenCalled();
        });
    });

    it('should create a folder from the option', async () => {
        await setup();

        // Search for a label which does not exist
        const searchInput = screen.getByTestId('folder-dropdown:search-folder');

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: search } });
            // input has a debounce, so we need to wait for the onChange
            await wait(300);
        });

        // No more option are displayed
        const labels = screen.queryAllByTestId(/label-dropdown:folder-radio-/) as HTMLInputElement[];
        expect(labels.length).toBe(0);

        // Click on the create label option
        const createLabelOption = screen.getByTestId('folder-dropdown:create-folder-option');

        fireEvent.click(createLabelOption);

        // Get the modal content
        const createLabelModal = screen.getByRole('dialog', { hidden: true });
        const labelModalNameInput = getByTestIdDefault(createLabelModal, 'label/folder-modal:name') as HTMLInputElement;

        // Input is filled with the previous search content
        expect(labelModalNameInput.value).toEqual(search);
    });
});

import { act, findByTestId, fireEvent } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { ROOSTER_EDITOR_ID } from '@proton/components/components/editor/constants';
import { FeatureCode } from '@proton/features';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { getFeatureFlagsState } from '@proton/testing/lib/features';

import type { MailStore } from 'proton-mail/store/store';

import { MESSAGE_ACTIONS } from '../../../../constants';
import { addApiMock } from '../../../../helpers/test/api';
import { getCompleteAddress, minimalCache } from '../../../../helpers/test/cache';
import { addApiKeys, getAddressKeyCache } from '../../../../helpers/test/crypto';
import { getDropdown, waitForSpyCall } from '../../../../helpers/test/helper';
import { addressID, setup } from '../../../message/tests/Message.test.helpers';
import { data, fromFields, getExpectedDefaultPlainTextContent, getMessage } from './QuickReply.test.data';

export const getStateMessageFromParentID = (store: MailStore, parentMessageID: string) => {
    const messagesFromCache = store.getState().messages;

    // search for message ID of message from parentID (The QR generated)
    const foundMessageID = Object.keys(messagesFromCache).find((id) => {
        return messagesFromCache[id]?.draftFlags?.ParentID === parentMessageID;
    });

    return foundMessageID ? messagesFromCache[foundMessageID] : undefined;
};

interface QuickReplyTestConfig {
    meKeys: any;
    referenceMessageBody?: string;
    isPlainText?: boolean;
    isSender?: boolean;
}

export const setupQuickReplyTests = async ({
    meKeys,
    referenceMessageBody = data.defaultReferenceMessageBody,
    isPlainText,
    isSender,
}: QuickReplyTestConfig) => {
    minimalCache();

    addApiKeys(false, fromFields.fromAddress, []);
    addApiKeys(false, fromFields.toAddress, []);

    // Reference message
    const message = getMessage(!!isSender, !!isPlainText, referenceMessageBody);

    const expectedDefaultPlainTextContent = getExpectedDefaultPlainTextContent(referenceMessageBody);

    const container = await setup(
        message,
        { conversationMode: true, message: message.data },
        {
            preloadedState: {
                addresses: getModelState([
                    getCompleteAddress({
                        ID: addressID,
                        Email: fromFields.meAddress,
                        Receive: 1,
                        Status: 1,
                        Send: 1,
                    }),
                ]),
                addressKeys: getAddressKeyCache(addressID, meKeys),
                mailSettings: getModelState({
                    PMSignature: PM_SIGNATURE.ENABLED,
                    DraftMIMEType: MIME_TYPES.DEFAULT,
                } as MailSettings),
                features: getFeatureFlagsState([[FeatureCode.QuickReply, true]]),
            },
        }
    );

    const createCall = jest.fn((message) => {
        return Promise.resolve({
            Message: {
                ID: data.quickReplyMessageID,
                ...message.data.Message,
            },
        });
    });
    const updateCall = jest.fn((message) => {
        return Promise.resolve(message.data);
    });
    const sendCall = jest.fn((message) => {
        return Promise.resolve({ Sent: { ID: data.quickReplyMessageID, ...message.data } });
    });
    addApiMock(`mail/v4/messages`, createCall, 'post');
    addApiMock(`mail/v4/messages/${data.quickReplyMessageID}`, updateCall, 'put');
    addApiMock(`mail/v4/messages/${data.quickReplyMessageID}`, sendCall, 'post');

    const getPlainTextEditor = async () => {
        return (await container.findByTestId('editor-textarea')) as HTMLTextAreaElement;
    };

    const getRoosterEditor = async () => {
        const iframe = (await container.findByTestId('rooster-iframe')) as HTMLIFrameElement;
        return iframe.contentDocument?.getElementById(ROOSTER_EDITOR_ID);
    };

    const getRecipientList = async () => {
        const recipientListContainer = await container.findByTestId('recipients-list-string');
        return recipientListContainer.innerHTML;
    };

    const updateReplyType = async (type: MESSAGE_ACTIONS, isTriggeringCreate = false) => {
        const quickReplyTypeDropdown = await container.findByTestId('quick-reply-type-dropdown');

        // Open the dropdown
        fireEvent.click(quickReplyTypeDropdown);

        const dropdown = await getDropdown();

        const quickReplyTypeReplyButton = await findByTestId(dropdown, 'quick-reply-type-dropdown-reply-button');
        const quickReplyTypeReplyAllButton = await findByTestId(dropdown, 'quick-reply-type-dropdown-reply-all-button');

        // Click on the button
        if (type === MESSAGE_ACTIONS.REPLY) {
            await act(async () => {
                fireEvent.click(quickReplyTypeReplyButton);
                await wait(3000);
                if (isTriggeringCreate) {
                    await waitForSpyCall({ spy: createCall });
                } else {
                    await waitForSpyCall({ spy: updateCall });
                }
            });
        } else if (MESSAGE_ACTIONS.REPLY_ALL) {
            await act(async () => {
                fireEvent.click(quickReplyTypeReplyAllButton);
                await wait(3000);
                if (isTriggeringCreate) {
                    await waitForSpyCall({ spy: createCall });
                } else {
                    await waitForSpyCall({ spy: updateCall });
                }
            });
        }
    };

    const openQuickReply = async () => {
        await container.open();

        const quickReplyContainerButton = await container.findByTestId('quick-reply-container-button');

        // Open quick reply
        await act(async () => {
            fireEvent.click(quickReplyContainerButton);
        });
    };

    const updateQuickReplyContent = async (newContent: string) => {
        if (isPlainText) {
            const plainTextEditor = await getPlainTextEditor();

            if (plainTextEditor) {
                await act(async () => {
                    fireEvent.change(plainTextEditor, { target: { value: newContent } });
                    await wait(3000);
                    await waitForSpyCall({ spy: createCall });
                });
            }
        } else {
            const roosterEditor = (await getRoosterEditor()) as HTMLElement;

            await act(async () => {
                // fireEvent.input will trigger an update inside the editor, but we need to add our content in it
                // The first thing to do is add content in the editor by hand
                // Then triggering input event will trigger the onChange in the composer, which will update the state etc....
                // I'm totally cheating but the goal is only to check that the editor will receive new content such as the state
                roosterEditor.innerHTML = `${newContent}${roosterEditor.innerHTML}`;

                fireEvent.input(roosterEditor);
                await wait(3000);
                await waitForSpyCall({ spy: createCall });
            });
        }
    };

    const sendQuickReply = async () => {
        const sendButton = await container.findByTestId('quick-reply-send-button');

        await act(async () => {
            fireEvent.click(sendButton);
            await waitForSpyCall({ spy: sendCall });
        });
    };

    return {
        container,
        store: container.store,
        getPlainTextEditor,
        getRoosterEditor,
        createCall,
        updateCall,
        sendCall,
        openQuickReply,
        updateQuickReplyContent,
        sendQuickReply,
        expectedDefaultPlainTextContent,
        getRecipientList,
        updateReplyType,
        waitForSpyCall,
    };
};

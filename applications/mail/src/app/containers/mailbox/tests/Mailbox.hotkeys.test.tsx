import { fireEvent } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiMock, assertCheck, assertFocus, clearAll, tick } from '../../../helpers/test/helper';
import MailboxContainer from '../MailboxContainer';
import type { SetupArgs } from './Mailbox.test.helpers';
import { setup as generalSetup, getElements, props } from './Mailbox.test.helpers';

describe('Mailbox hotkeys', () => {
    const conversations = getElements(4);

    beforeEach(clearAll);

    const setup = async ({ conversations: inputConversation, ...rest }: SetupArgs = {}) => {
        const usedConversations = inputConversation || conversations;
        const result = await generalSetup({ conversations: usedConversations, ...rest });
        const mailbox = result.getByTestId('mailbox');
        return {
            ...result,
            down: () => fireEvent.keyDown(mailbox, { key: 'ArrowDown' }),
            up: () => fireEvent.keyDown(mailbox, { key: 'ArrowUp' }),
            ctrlDown: () => fireEvent.keyDown(mailbox, { key: 'ArrowDown', ctrlKey: true }),
            ctrlUp: () => fireEvent.keyDown(mailbox, { key: 'ArrowUp', ctrlKey: true }),
            left: () => fireEvent.keyDown(mailbox, { key: 'ArrowLeft' }),
            right: () => fireEvent.keyDown(mailbox, { key: 'ArrowRight' }),
            enter: () => fireEvent.keyDown(mailbox, { key: 'Enter' }),
            escape: () => fireEvent.keyDown(mailbox, { key: 'Escape' }),
            j: () => fireEvent.keyDown(mailbox, { key: 'J' }),
            k: () => fireEvent.keyDown(mailbox, { key: 'K' }),
            space: () => fireEvent.keyDown(mailbox, { key: ' ' }),
            shftSpace: () => fireEvent.keyDown(mailbox, { key: ' ', shiftKey: true }),
            ctrlA: () => fireEvent.keyDown(mailbox, { key: 'A', ctrlKey: true }),
            x: () => fireEvent.keyDown(mailbox, { key: 'X' }),
            shftX: () => fireEvent.keyDown(mailbox, { key: 'X', shiftKey: true }),
            a: () => fireEvent.keyDown(mailbox, { key: 'A' }),
            i: () => fireEvent.keyDown(mailbox, { key: 'I' }),
            s: () => fireEvent.keyDown(mailbox, { key: 'S' }),
            star: () => fireEvent.keyDown(mailbox, { key: '*' }),
            t: () => fireEvent.keyDown(mailbox, { key: 'T' }),
            ctrlBackspace: () => fireEvent.keyDown(mailbox, { key: 'Backspace', ctrlKey: true }),
        };
    };

    it('should navigate through items with arrows', async () => {
        const { getItems, down, up, ctrlDown, ctrlUp } = await setup();
        const items = getItems();

        down();
        assertFocus(items[0]);
        down();
        assertFocus(items[1]);
        ctrlDown();
        assertFocus(items[3]);
        up();
        assertFocus(items[2]);
        ctrlUp();
        assertFocus(items[0]);
    });

    it('should navigate left and right', async () => {
        const TestComponent = (props: any) => {
            return (
                <>
                    <div data-shortcut-target="navigation-link" aria-current="page" tabIndex={-1}>
                        nav test
                    </div>
                    <MailboxContainer {...props} />
                    <div data-shortcut-target="message-container" tabIndex={-1}>
                        message test
                    </div>
                </>
            );
        };

        const { left, right, getItems } = await setup({ Component: TestComponent as any });

        const sidebar = document.querySelector('[data-shortcut-target="navigation-link"]');
        // const message = document.querySelector('[data-shortcut-target="message-container"]');
        const items = getItems();
        left();
        assertFocus(sidebar);
        right();
        assertFocus(items[0]);
    });

    it('should enter a message and leave', async () => {
        const { down, enter, escape, history } = await setup();

        down();
        enter();

        expect(history.location.pathname).toBe(`/${props.labelID}/${conversations[3].ID}`);

        escape();

        expect(history.location.pathname).toBe(`/${props.labelID}`);
    });

    it('should navigate to next message with J', async () => {
        const conversation = conversations[2];
        const message = { ID: 'MessageID', Subject: 'test', Body: 'test', Flags: 0 } as Message;
        addApiMock(`mail/v4/conversations/${conversation.ID}`, () => ({
            Conversation: conversation,
            Messages: [message],
        }));

        const { j, history } = await setup({ conversations, elementID: conversation.ID });

        j();

        expect(history.location.pathname).toBe(`/${props.labelID}/${conversations[1].ID}`);
    });

    it('should navigate to previous message with K', async () => {
        const conversation = conversations[2];
        const message = { ID: 'MessageID', Subject: 'test', Body: 'test', Flags: 0 } as Message;
        addApiMock(`mail/v4/conversations/${conversation.ID}`, () => ({
            Conversation: conversation,
            Messages: [message],
        }));

        const { k, history } = await setup({ conversations, elementID: conversation.ID });

        k();

        expect(history.location.pathname).toBe(`/${props.labelID}/${conversations[3].ID}`);
    });

    it('should allow to select elements with keyboard', async () => {
        const { getItems, down, space, x, shftSpace, shftX, ctrlA, ctrlUp } = await setup();

        const assertChecks = (array: boolean[]) => {
            const items = getItems();
            for (let i = 0; i < array.length; i++) {
                assertCheck(items[i], array[i]);
            }
        };

        down();
        space();
        assertChecks([true, false, false, false]);

        down();
        down();
        shftSpace();
        assertChecks([true, true, true, false]);

        ctrlA();
        assertChecks([true, true, true, true]);

        ctrlA();
        assertChecks([false, false, false, false]);

        ctrlUp();
        x();
        assertChecks([true, false, false, false]);

        down();
        down();
        shftX();
        assertChecks([true, true, true, false]);
    });

    it('should allow to move elements with keyboard', async () => {
        const labelSpy = jest.fn<any, any>(() => ({ UndoToken: 'token' }));
        addApiMock('mail/v4/conversations/label', labelSpy, 'put');

        const deleteSpy = jest.fn();
        addApiMock('mail/v4/conversations/delete', deleteSpy, 'put');

        const conversations = getElements(20, MAILBOX_LABEL_IDS.TRASH); // Firsts items are older than the last ones

        const { down, space, a, i, s, t, ctrlBackspace, getByTestId } = await setup({
            labelID: MAILBOX_LABEL_IDS.TRASH,
            conversations,
        });

        let callTimes = 0;

        const expectLabelCall = (LabelID: string) => {
            callTimes++;
            expect(labelSpy).toHaveBeenCalledTimes(callTimes);
            const result = labelSpy.mock.calls[callTimes - 1][0].data;
            expect(result.LabelID).toBe(LabelID);

            expect(result.IDs).toEqual([conversations[conversations.length - 1 * callTimes].ID]);
        };

        down();
        space();
        a();
        await tick();
        expectLabelCall(MAILBOX_LABEL_IDS.ARCHIVE);

        down();
        space();
        i();
        await tick();
        expectLabelCall(MAILBOX_LABEL_IDS.INBOX);

        down();
        space();
        s();
        await tick();
        expectLabelCall(MAILBOX_LABEL_IDS.SPAM);

        down();
        space();
        t();
        await tick();
        expectLabelCall(MAILBOX_LABEL_IDS.TRASH);

        ctrlBackspace();
        const button = getByTestId('permanent-delete-modal:submit');
        fireEvent.click(button as HTMLButtonElement);
        await tick();

        expect(deleteSpy).toHaveBeenCalled();
    });
});

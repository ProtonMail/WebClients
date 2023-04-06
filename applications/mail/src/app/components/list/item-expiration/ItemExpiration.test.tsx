import { screen } from '@testing-library/react';
import { addDays, addHours, addMinutes, getUnixTime } from 'date-fns';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { addToCache } from '@proton/testing/index';

import { minimalCache } from '../../../helpers/test/cache';
import { render } from '../../../helpers/test/render';
import { Element } from '../../../models/element';
import ItemExpiration from './ItemExpiration';

const emptyElement = {} as Element;
const defaultLabelID = MAILBOX_LABEL_IDS.INBOX;

describe('ItemExpiration', () => {
    it('should not render if expirationTime is not provided', async () => {
        await render(<ItemExpiration labelID={defaultLabelID} element={emptyElement} />);
        expect(screen.queryByTestId('item-expiration')).not.toBeInTheDocument();
    });

    it('should have color-danger class if it is expiring in less than a day', async () => {
        const date = addHours(new Date(), 1);
        const expirationTime = getUnixTime(date);
        await render(
            <ItemExpiration labelID={defaultLabelID} element={emptyElement} expirationTime={expirationTime} />
        );
        expect(screen.getByTestId('item-expiration')).toHaveClass('color-danger');
    });

    it('should not have color-danger class if it is expiring in more than a day', async () => {
        const date = addHours(new Date(), 25);
        const expirationTime = getUnixTime(date);
        await render(
            <ItemExpiration labelID={defaultLabelID} element={emptyElement} expirationTime={expirationTime} />
        );
        expect(screen.getByTestId('item-expiration')).not.toHaveClass('color-danger');
    });

    it('should show a short remaining time', async () => {
        const date = addMinutes(new Date(), 10);
        const expirationTime = getUnixTime(date);
        await render(
            <ItemExpiration labelID={defaultLabelID} element={emptyElement} expirationTime={expirationTime} />
        );
        expect(screen.getByText('<1 d')).toBeInTheDocument();
    });

    it('should diplay 30 days', async () => {
        const date = addDays(new Date(), 30);
        const expirationTime = getUnixTime(date);
        await render(
            <ItemExpiration labelID={defaultLabelID} element={emptyElement} expirationTime={expirationTime} />
        );
        expect(screen.getByText('30 d')).toBeInTheDocument();
    });

    describe('Icon', () => {
        it('Should display Trash if autoDelete setting is conversation, label ID is valid and setting is not null', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();
            addToCache('MailSettings', { AutoDeleteSpamAndTrashDays: 30 });

            await render(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.TRASH}
                    element={emptyElement}
                    expirationTime={expirationTime}
                />,
                false
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-trash-clock'
            );
        });

        it('Should display Trash if autoDelete setting is message and expire flag is not frozen', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();
            addToCache('MailSettings', { AutoDeleteSpamAndTrashDays: 30 });

            const element = {
                ConversationID: '',
            } as MessageMetadata;

            await render(
                <ItemExpiration labelID={MAILBOX_LABEL_IDS.TRASH} element={element} expirationTime={expirationTime} />,
                false
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-trash-clock'
            );
        });

        it('Should display Hourglass if autoDelete setting is conversation, and label ID is not valid', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();
            addToCache('MailSettings', { AutoDeleteSpamAndTrashDays: 30 });

            await render(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.INBOX}
                    element={emptyElement}
                    expirationTime={expirationTime}
                />,
                false
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-hourglass'
            );
        });

        it('Should display Hourglass if autoDelete setting is conversation, label ID is valid and setting is null', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();
            addToCache('MailSettings', { AutoDeleteSpamAndTrashDays: null });

            await render(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.TRASH}
                    element={emptyElement}
                    expirationTime={expirationTime}
                />,
                false
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-hourglass'
            );
        });
    });
});

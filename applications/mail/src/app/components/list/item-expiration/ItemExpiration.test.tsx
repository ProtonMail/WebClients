import { screen } from '@testing-library/react';
import { addDays, addHours, addMinutes, getUnixTime } from 'date-fns';

import { getModelState } from '@proton/account/test';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

import { minimalCache } from '../../../helpers/test/cache';
import { mailTestRender } from '../../../helpers/test/render';
import type { Element } from '../../../models/element';
import ItemExpiration from './ItemExpiration';

const defaultLabelID = MAILBOX_LABEL_IDS.INBOX;

const getElement = (type: 'message' | 'conversation' = 'conversation', elementProps?: Partial<Element>) => {
    const element =
        type === 'message'
            ? ({
                  // We consider an element as a message if it has conversationID
                  ConversationID: '',
                  ...elementProps,
              } as MessageMetadata)
            : ({ ...elementProps } as Element);

    return element;
};

describe('ItemExpiration', () => {
    it('should not render if expirationTime is not provided', async () => {
        await mailTestRender(<ItemExpiration labelID={defaultLabelID} element={getElement()} />);
        expect(screen.queryByTestId('item-expiration')).not.toBeInTheDocument();
    });

    it('should have color-danger class if it is expiring in less than a day', async () => {
        const date = addHours(new Date(), 1);
        const expirationTime = getUnixTime(date);
        await mailTestRender(
            <ItemExpiration labelID={defaultLabelID} element={getElement()} expirationTime={expirationTime} />
        );
        expect(screen.getByTestId('item-expiration')).toHaveClass('color-danger');
    });

    it('should not have color-danger class if it is expiring in more than a day', async () => {
        const date = addHours(new Date(), 25);
        const expirationTime = getUnixTime(date);
        await mailTestRender(
            <ItemExpiration labelID={defaultLabelID} element={getElement()} expirationTime={expirationTime} />
        );
        expect(screen.getByTestId('item-expiration')).not.toHaveClass('color-danger');
    });

    it('should show a short remaining time', async () => {
        const date = addMinutes(new Date(), 10);
        const expirationTime = getUnixTime(date);
        await mailTestRender(
            <ItemExpiration labelID={defaultLabelID} element={getElement()} expirationTime={expirationTime} />
        );
        expect(screen.getByText('<1 d')).toBeInTheDocument();
    });

    it('should diplay 30 days', async () => {
        const date = addDays(new Date(), 30);
        const expirationTime = getUnixTime(date);
        await mailTestRender(
            <ItemExpiration labelID={defaultLabelID} element={getElement()} expirationTime={expirationTime} />
        );
        expect(screen.getByText('30 d')).toBeInTheDocument();
    });

    const mailSettings = { AutoDeleteSpamAndTrashDays: AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE } as MailSettings;

    describe('Element is conversation', () => {
        it('Should display Trash icon when label ID is valid and setting is not null', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();

            await mailTestRender(
                <ItemExpiration
                    element={getElement()}
                    expirationTime={expirationTime}
                    labelID={MAILBOX_LABEL_IDS.TRASH}
                />,
                {
                    preloadedState: {
                        mailSettings: getModelState(mailSettings),
                    },
                }
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-trash-clock'
            );
        });

        it('Should display Hourglass if label ID is not valid', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();

            await mailTestRender(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.INBOX}
                    element={getElement()}
                    expirationTime={expirationTime}
                />,
                {
                    preloadedState: {
                        mailSettings: getModelState(mailSettings),
                    },
                }
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-hourglass'
            );
        });

        it('Should display Hourglass icon if label ID is valid and setting is null', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();

            await mailTestRender(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.TRASH}
                    element={getElement()}
                    expirationTime={expirationTime}
                />,
                {
                    preloadedState: {
                        mailSettings: getModelState({
                            ...mailSettings,
                            AutoDeleteSpamAndTrashDays: null,
                        } as any as MailSettings),
                    },
                }
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-hourglass'
            );
        });
    });

    describe('Element is message', () => {
        it('Should display Trash icon if expire flag is not frozen', async () => {
            const expirationTime = getUnixTime(addDays(new Date(), 30));
            minimalCache();

            await mailTestRender(
                <ItemExpiration
                    labelID={MAILBOX_LABEL_IDS.TRASH}
                    element={getElement('message')}
                    expirationTime={expirationTime}
                />,
                {
                    preloadedState: {
                        mailSettings: getModelState({
                            AutoDeleteSpamAndTrashDays: AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE,
                        } as any as MailSettings),
                    },
                }
            );

            expect(screen.getByTestId('item-expiration').querySelector('use')?.getAttribute('xlink:href')).toBe(
                '#ic-trash-clock'
            );
        });
    });
});

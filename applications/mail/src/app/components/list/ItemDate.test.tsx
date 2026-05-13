import { render, screen } from '@testing-library/react';

import { useMailSelector } from 'proton-mail/store/hooks';

import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import ItemDate from './ItemDate';

jest.mock('proton-mail/store/hooks');
jest.mocked(useMailSelector).mockImplementation(() => ({ conversationMode: true }));

const element = {
    ID: 'elementID',
    Time: 1672531200,
} as Element;

const snoozedElement = {
    ID: 'elementID',
    Time: 1672531200,
    Labels: [
        {
            ID: '16',
            ContextSnoozeTime: 1704067200,
        },
    ],
} as Conversation;

describe('ItemDate', () => {
    it('Should display regular date with simple mode', () => {
        render(<ItemDate element={element} labelID="1" />);
        expect(screen.getByTestId('item-date-simple'));
    });
    it('Should display regular date with distance mode', () => {
        render(<ItemDate element={element} labelID="1" mode="distance" />);
        expect(screen.getByTestId('item-date-distance'));
    });
    it('Should display the snooze time when snooze time and in list view while in snooze folder', () => {
        render(<ItemDate element={snoozedElement} labelID="16" isInListView />);
        expect(screen.getByTestId('item-date-snoozed'));
    });
    it('Should not display the snooze time when snooze time and in list view and in inbox', () => {
        const { queryByTestId } = render(<ItemDate element={snoozedElement} labelID="0" isInListView />);
        expect(queryByTestId('item-date-snoozed')).toBeNull();
    });
    it('Should display regular date with simple mode when not in list', () => {
        render(<ItemDate element={snoozedElement} labelID="1" />);
        expect(screen.getByTestId('item-date-simple'));
    });
    it('Should display regular date with distance mode when not in list', () => {
        render(<ItemDate element={snoozedElement} labelID="1" mode="distance" />);
        expect(screen.getByTestId('item-date-distance'));
    });
});

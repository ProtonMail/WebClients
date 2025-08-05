import { screen } from '@testing-library/react';

import { mailTestRender } from '../../helpers/test/render';
import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import ItemDate from './ItemDate';

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
    it('Should display regular date with simple mode', async () => {
        await mailTestRender(<ItemDate element={element} labelID="1" />);
        expect(screen.getByTestId('item-date-simple'));
    });
    it('Should display regular date with distance mode', async () => {
        await mailTestRender(<ItemDate element={element} labelID="1" mode="distance" />);
        expect(screen.getByTestId('item-date-distance'));
    });
    it('Should display the snooze time when snooze time and in list view while in snooze folder', async () => {
        await mailTestRender(<ItemDate element={snoozedElement} labelID="16" isInListView />);
        expect(screen.getByTestId('item-date-snoozed'));
    });
    it('Should not display the snooze time when snooze time and in list view and in inbox', async () => {
        const { queryByTestId } = await mailTestRender(<ItemDate element={snoozedElement} labelID="0" isInListView />);
        expect(queryByTestId('item-date-snoozed')).toBeNull();
    });
    it('Should display regular date with simple mode when not in list', async () => {
        await mailTestRender(<ItemDate element={snoozedElement} labelID="1" />);
        expect(screen.getByTestId('item-date-simple'));
    });
    it('Should display regular date with distance mode when not in list', async () => {
        await mailTestRender(<ItemDate element={snoozedElement} labelID="1" mode="distance" />);
        expect(screen.getByTestId('item-date-distance'));
    });
});

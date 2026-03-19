import { fireEvent } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';

import CheckListItem from './CheckListItem';

const checklistItemProps = {
    icon: 'icon',
    text: 'text',
    onClick: jest.fn(),
    smallVariant: false,
    done: false,
};

describe('ChecklistItem', () => {
    it('Should trigger onclick when clicked', async () => {
        const onClick = jest.fn();
        const { getByRole } = renderWithProviders(<CheckListItem {...checklistItemProps} onClick={onClick} />);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).toHaveBeenCalled();
    });

    it('Should not trigger onclick when disabled', async () => {
        const onClick = jest.fn();
        const { getByRole } = renderWithProviders(<CheckListItem {...checklistItemProps} onClick={onClick} disabled />);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('Should trigger onclick when done', async () => {
        const onClick = jest.fn();
        const { getByRole } = renderWithProviders(<CheckListItem {...checklistItemProps} onClick={onClick} done />);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).toHaveBeenCalled();
    });
});

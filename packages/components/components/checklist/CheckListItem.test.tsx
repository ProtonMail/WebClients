import { fireEvent } from '@testing-library/react';

import { render } from '@proton/components/containers/contacts/tests/render';

import CheckListItem from './CheckListItem';

const checklistItemProps = {
    largeIcon: 'largeIcon',
    smallIcon: 'smallIcon',
    text: 'text',
    onClick: jest.fn(),
    smallVariant: false,
    done: false,
};

describe('ChecklistItem', () => {
    it('Should trigger onclick when clicked', async () => {
        const onClick = jest.fn();
        const { getByRole } = render(<CheckListItem {...checklistItemProps} onClick={onClick} />, false);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).toHaveBeenCalled();
    });

    it('Should not trigger onclick when disabled', async () => {
        const onClick = jest.fn();
        const { getByRole } = render(<CheckListItem {...checklistItemProps} onClick={onClick} disabled />, false);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('Should trigger onclick when done', async () => {
        const onClick = jest.fn();
        const { getByRole } = render(<CheckListItem {...checklistItemProps} onClick={onClick} done />, false);
        const item = getByRole('button');
        fireEvent.click(item);
        expect(onClick).toHaveBeenCalled();
    });

    it('Should use the largeIcon when smallVariant is false', async () => {
        const { getByTestId } = render(<CheckListItem {...checklistItemProps} />, false);
        const icon = getByTestId('checklist-item-icon-large');
        expect(icon).toBeTruthy();
    });

    it('Should use the smallIcon when smallVariant is true', async () => {
        const { getByTestId } = render(<CheckListItem {...checklistItemProps} smallVariant />, false);
        const icon = getByTestId('checklist-item-icon-small');
        expect(icon).toBeTruthy();
    });

    it('Should not display image if both images are not defined', () => {
        const { container } = render(
            <CheckListItem {...checklistItemProps} largeIcon={undefined} smallIcon={undefined} />,
            false
        );
        const icon = container.querySelectorAll('img');
        expect(icon.length).toBe(0);
    });
});

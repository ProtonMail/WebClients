import { fireEvent, render, screen } from '@testing-library/react';

import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';

import { emailCountDetail, hasEmailSelection, referenceName, renderEmailSelectionBody } from './emailSelection';

const action: ActionRequest = {
    type: 'move_emails',
    ids: ['email-a1b2c3', 'email-d4e5f6'],
    folder: null,
    location: 'trash',
};
const labels = { 'email-a1b2c3': 'Booking confirmation', 'email-d4e5f6': 'Receipt' };

const renderBody = (selectedIds: string[]) => {
    const onChange = jest.fn();
    render(
        <>
            {renderEmailSelectionBody({
                action,
                labels,
                params: { ids: selectedIds, folder: null, location: 'trash' },
                onChange,
            })}
        </>
    );

    return { onChange, checkboxes: screen.getAllByRole('checkbox') };
};

describe('referenceName', () => {
    it('falls back to the raw reference when nothing recorded a name for it', () => {
        expect(referenceName('email-a1b2c3', labels)).toBe('Booking confirmation');
        expect(referenceName('email-unknown', labels)).toBe('email-unknown');
    });
});

describe('emailCountDetail', () => {
    it('counts the emails rather than joining every subject, and takes the singular at one', () => {
        expect(emailCountDetail(action)).toBe('2 emails');
        expect(emailCountDetail({ ...action, ids: ['email-a1b2c3'] })).toBe('1 email');
    });

    it('has nothing to disclose for an empty selection', () => {
        expect(emailCountDetail({ ...action, ids: [] })).toBeUndefined();
    });
});

describe('renderEmailSelectionBody', () => {
    it('names every proposed email, so the user reads subjects rather than references', () => {
        renderBody([...action.ids]);

        expect(screen.getByText('Booking confirmation')).toBeInTheDocument();
        expect(screen.getByText('Receipt')).toBeInTheDocument();
    });

    it('narrows the selection without touching the proposed set', () => {
        const { onChange, checkboxes } = renderBody([...action.ids]);

        fireEvent.click(checkboxes[0]);

        expect(onChange).toHaveBeenCalledWith({ ids: ['email-d4e5f6'], folder: null, location: 'trash' });
        expect(action.ids).toEqual(['email-a1b2c3', 'email-d4e5f6']);
    });

    // The whole proposed set stays on screen rather than only the selection, which is what makes a row the
    // user deselected re-tickable — the reason this body renders `action.ids` and not `params.ids`.
    it('still renders a deselected row, so it can be put back', () => {
        const { onChange, checkboxes } = renderBody(['email-d4e5f6']);

        expect(checkboxes).toHaveLength(2);

        fireEvent.click(checkboxes[0]);

        expect(onChange).toHaveBeenCalledWith({
            ids: ['email-d4e5f6', 'email-a1b2c3'],
            folder: null,
            location: 'trash',
        });
    });
});

describe('hasEmailSelection', () => {
    it('closes off an apply that would run on nothing', () => {
        expect(hasEmailSelection({ ids: [] })).toBe(false);
        expect(hasEmailSelection({ ids: ['email-a1b2c3'] })).toBe(true);
    });
});

import { fireEvent, screen } from '@testing-library/react';

import { mailTestRender } from '../../../../helpers/tests/render';
import ConfirmSaveToDrive from './ConfirmSaveToDrive';

describe('ConfirmSaveToDrive', () => {
    const setup = async () => {
        const onResolve = vi.fn();
        const onReject = vi.fn();
        await mailTestRender(<ConfirmSaveToDrive open onResolve={onResolve} onReject={onReject} />);
        return { onResolve, onReject };
    };

    it('shows the save wording, the Learn more link and Save and Cancel', async () => {
        await setup();

        expect(screen.getByText('Verification error')).toBeInTheDocument();
        expect(
            screen.getByText(
                "The attachment's signature failed verification. You can still save it to Proton Drive, but it might have been tampered with.",
                { exact: false }
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Do you want to save this attachment anyway?', { exact: false })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
            'href',
            expect.stringContaining('/digital-signature')
        );
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('Escape rejects like Cancel', async () => {
        const { onResolve, onReject } = await setup();

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onReject).toHaveBeenCalledTimes(1);
        expect(onResolve).not.toHaveBeenCalled();
    });
});

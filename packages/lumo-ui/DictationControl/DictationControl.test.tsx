import { fireEvent, render, screen } from '@testing-library/react';

import DictationControl from './DictationControl';

describe('DictationControl', () => {
    it('shows the supplied trigger while idle', () => {
        render(
            <DictationControl isDictating={false} getAudioLevel={() => 0} onCancel={jest.fn()} onAccept={jest.fn()}>
                <button type="button">Start dictation</button>
            </DictationControl>
        );

        expect(screen.getByRole('button', { name: 'Start dictation' })).toBeVisible();
    });

    it('reports explicit cancel and accept actions', () => {
        const onCancel = jest.fn();
        const onAccept = jest.fn();
        render(
            <DictationControl isDictating hasError getAudioLevel={() => 0} onCancel={onCancel} onAccept={onAccept}>
                <button type="button">Start dictation</button>
            </DictationControl>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancel dictation' }));
        fireEvent.click(screen.getByRole('button', { name: 'Accept dictation' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('supports client-specific labels', () => {
        render(
            <DictationControl
                isDictating
                hasError
                getAudioLevel={() => 0}
                onCancel={jest.fn()}
                onAccept={jest.fn()}
                labels={{ connectionError: 'Voice unavailable' }}
            >
                <button type="button">Start dictation</button>
            </DictationControl>
        );

        expect(screen.getByText('Voice unavailable')).toBeVisible();
    });
});

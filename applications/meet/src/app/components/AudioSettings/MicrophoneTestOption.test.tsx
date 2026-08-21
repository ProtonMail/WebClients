import { render, screen } from '@testing-library/react';

import type * as UseMicrophoneTest from '../../hooks/useMicrophoneTest';
import { MicrophoneTestFailure, MicrophoneTestStatus } from '../../hooks/useMicrophoneTest';
import { MicrophoneTestOption } from './MicrophoneTestOption';

const mockToggleTest = vi.fn();
const mockUseMicrophoneTest = vi.fn();

// The enums come from the real module, whose noise cancellation models cannot load under jsdom.
vi.mock('../../processors/noise-cancellation/useNoiseCancellationModel', () => ({
    useNoiseCancellationModel: () => undefined,
}));

vi.mock('../../hooks/useMicrophoneTest', async (importOriginal) => ({
    ...(await importOriginal<typeof UseMicrophoneTest>()),
    useMicrophoneTest: (props: unknown) => mockUseMicrophoneTest(props),
}));

const renderOption = ({
    status = MicrophoneTestStatus.Idle,
    failure = null as MicrophoneTestFailure | null,
    level = 0,
    elapsedMs = 0,
} = {}) => {
    mockUseMicrophoneTest.mockReturnValue({
        status,
        level,
        failure,
        toggleTest: mockToggleTest,
        elapsedMs,
    });

    return render(
        <MicrophoneTestOption microphoneDeviceId="mic-1" speakerDeviceId="speaker-1" noiseCancellationEnabled />
    );
};

describe('MicrophoneTestOption', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('offers to start the test when idle, with no meter', () => {
        renderOption();

        expect(screen.getByRole('button', { name: 'Test microphone' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    });

    it('shows the input level while recording', () => {
        renderOption({ status: MicrophoneTestStatus.Recording, level: 0.5 });

        expect(screen.getByRole('button', { name: 'Recording your microphone...' })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0.5');
    });

    it('counts the elapsed recording time', () => {
        renderOption({ status: MicrophoneTestStatus.Recording, elapsedMs: 2_400 });

        expect(screen.getByText('00:02')).toBeInTheDocument();
    });

    it('hides the meter during playback', () => {
        renderOption({ status: MicrophoneTestStatus.Playing });

        expect(screen.getByRole('button', { name: 'Playing back...' })).toBeInTheDocument();
        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    });

    it('forwards the devices and the noise cancellation setting to the hook', () => {
        renderOption();

        expect(mockUseMicrophoneTest).toHaveBeenCalledWith({
            microphoneDeviceId: 'mic-1',
            speakerDeviceId: 'speaker-1',
            noiseCancellationEnabled: true,
        });
    });

    // Only the reasons that ask something different of the user, rather than every string.
    it.each([
        [MicrophoneTestFailure.Permission, /blocked/],
        [MicrophoneTestFailure.Busy, /busy/],
        [MicrophoneTestFailure.Unknown, /Couldn’t start/],
    ])('explains a %s failure instead of the level', (failure, expected) => {
        renderOption({ failure });

        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    });
});

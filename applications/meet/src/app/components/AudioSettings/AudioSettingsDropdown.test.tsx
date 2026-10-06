import { createRef } from 'react';

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SliceDeviceState } from '@proton/meet/store/slices/deviceManagementSlice/types';
import type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';

import type * as Browser from '../../utils/browser';
import { AudioSettingsDropdown } from './AudioSettingsDropdown';

vi.mock('../../processors/noise-cancellation/useNoiseCancellationModel', () => ({
    useNoiseCancellationModel: () => undefined,
}));

vi.mock('../../contexts/MediaManagementProvider/MediaManagementContext', () => ({
    useMediaManagementContext: () => ({ noiseFilter: false, toggleNoiseFilter: vi.fn() }),
}));

vi.mock('../../utils/browser', async (importOriginal) => ({
    ...(await importOriginal<typeof Browser>()),
    supportsSetSinkId: () => true,
}));

const macMicrophone: SerializableDeviceInfo = {
    deviceId: 'mic-mac',
    label: 'MacBook Pro Microphone',
    kind: 'audioinput',
    groupId: 'group-mac',
};
const iPhoneMicrophone: SerializableDeviceInfo = {
    deviceId: 'mic-iphone',
    label: 'RayoiPhone Microphone',
    kind: 'audioinput',
    groupId: 'group-iphone',
};
const macSpeaker: SerializableDeviceInfo = {
    deviceId: 'speaker-mac',
    label: 'MacBook Pro Speakers',
    kind: 'audiooutput',
    groupId: 'group-mac',
};
const airpodsSpeaker: SerializableDeviceInfo = {
    deviceId: 'speaker-airpods',
    label: 'AirPods',
    kind: 'audiooutput',
    groupId: 'group-airpods',
};

const microphoneStateWithLostPreference: SliceDeviceState = {
    systemDefault: macMicrophone,
    systemDefaultLabel: 'Default - AirPods',
    hasDefaultOption: true,
    useSystemDefault: false,
    preferredAvailable: false,
    preferredDevice: null,
    preferredDeviceId: 'mic-jabra',
};

const speakerStateWithLostPreference: SliceDeviceState = {
    systemDefault: macSpeaker,
    systemDefaultLabel: 'Default - AirPods',
    hasDefaultOption: true,
    useSystemDefault: false,
    preferredAvailable: false,
    preferredDevice: null,
    preferredDeviceId: 'speaker-jabra',
};

const handleInputDeviceChange = vi.fn().mockResolvedValue(undefined);
const handleOutputDeviceChange = vi.fn().mockResolvedValue(undefined);
const withMicrophoneLoading = vi.fn((_deviceId: string, operation: () => Promise<void>) => operation());
const withSpeakerLoading = vi.fn((_deviceId: string, operation: () => Promise<void>) => operation());

const renderDropdown = ({
    audioDeviceId = null as string | null,
    activeOutputDeviceId = null as string | null,
    microphoneState = microphoneStateWithLostPreference,
    speakerState = speakerStateWithLostPreference,
    microphones = [macMicrophone, iPhoneMicrophone],
    speakers = [macSpeaker, airpodsSpeaker],
} = {}) =>
    render(
        <AudioSettingsDropdown
            anchorRef={createRef<HTMLButtonElement>()}
            handleInputDeviceChange={handleInputDeviceChange}
            handleOutputDeviceChange={handleOutputDeviceChange}
            audioDeviceId={audioDeviceId}
            activeOutputDeviceId={activeOutputDeviceId}
            microphoneState={microphoneState}
            speakerState={speakerState}
            microphones={microphones}
            speakers={speakers}
            onClose={vi.fn()}
            isMicrophoneLoading={() => false}
            isSpeakerLoading={() => false}
            withMicrophoneLoading={withMicrophoneLoading}
            withSpeakerLoading={withSpeakerLoading}
        />
    );

const listbox = (label: string) => within(screen.getByRole('listbox', { name: label }));

const selectedOptionNames = (listboxLabel: string) =>
    listbox(listboxLabel)
        .getAllByRole('option', { selected: true })
        .map((option) => option.textContent);

describe('AudioSettingsDropdown', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('marks the microphone in use rather than the system default row when the saved preference is gone', () => {
        renderDropdown({ audioDeviceId: 'mic-iphone' });

        expect(selectedOptionNames('Select a microphone')).toEqual(['RayoiPhone Microphone']);
    });

    it('marks the speaker in use rather than the system default row when the saved preference is gone', () => {
        renderDropdown({ activeOutputDeviceId: 'speaker-mac' });

        expect(selectedOptionNames('Select a speaker')).toEqual(['MacBook Pro Speakers']);
    });

    it('marks the system default row when that is what is in use', () => {
        renderDropdown({ audioDeviceId: 'default', activeOutputDeviceId: 'default' });

        expect(selectedOptionNames('Select a microphone')).toEqual(['Default - AirPods']);
        expect(selectedOptionNames('Select a speaker')).toEqual(['Default - AirPods']);
    });

    it('marks the system default row when the user picked it', () => {
        renderDropdown({
            audioDeviceId: 'mic-mac',
            microphoneState: { ...microphoneStateWithLostPreference, useSystemDefault: true },
        });

        expect(selectedOptionNames('Select a microphone')).toEqual(['Default - AirPods']);
    });

    it('marks nothing while no microphone is in use', () => {
        renderDropdown();

        expect(listbox('Select a microphone').queryAllByRole('option', { selected: true })).toEqual([]);
    });

    it('switches to the system default when a lost preference no longer blocks that row', async () => {
        renderDropdown({ audioDeviceId: 'mic-iphone' });

        await userEvent.click(listbox('Select a microphone').getByRole('option', { name: 'Default - AirPods' }));

        expect(handleInputDeviceChange).toHaveBeenCalledWith('default');
    });

    it('ignores a click on the microphone already in use', async () => {
        renderDropdown({ audioDeviceId: 'mic-iphone' });

        await userEvent.click(listbox('Select a microphone').getByRole('option', { name: 'RayoiPhone Microphone' }));

        expect(handleInputDeviceChange).not.toHaveBeenCalled();
    });
});

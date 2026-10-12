import { renderHook } from '@testing-library/react';

import { useAudioPlayer } from './useAudioPlayer';

const mockUseMeetSelector = vi.fn();

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => mockUseMeetSelector(selector),
}));

const mockSupportsSetSinkId = vi.fn();

vi.mock('../utils/browser', () => ({
    supportsSetSinkId: () => mockSupportsSetSinkId(),
}));

class MockAudio {
    static instances: MockAudio[] = [];

    public src: string;

    public preload = '';

    public currentTime = 0;

    public load = vi.fn();

    public play = vi.fn(async () => undefined);

    public pause = vi.fn();

    public setSinkId = vi.fn(async (_sinkId: string) => undefined);

    constructor(src?: string) {
        this.src = src ?? '';
        MockAudio.instances.push(this);
    }
}

const SOUND = '/assets/sounds/participant_joined.wav';

const getAudio = () => MockAudio.instances[MockAudio.instances.length - 1];

const renderAudioPlayer = (activeAudioOutputId: string | null) => {
    mockUseMeetSelector.mockReturnValue(activeAudioOutputId);
    return renderHook(() => useAudioPlayer(SOUND));
};

describe('useAudioPlayer', () => {
    beforeEach(() => {
        MockAudio.instances = [];
        mockSupportsSetSinkId.mockReturnValue(true);
        vi.stubGlobal('Audio', MockAudio);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('plays the sound on the meeting audio output', () => {
        const { result } = renderAudioPlayer('jabra');

        result.current.playAudio();

        expect(getAudio().src).toBe(SOUND);
        expect(getAudio().setSinkId).toHaveBeenCalledWith('jabra');
        expect(getAudio().play).toHaveBeenCalled();
    });

    it('follows the meeting audio output when it changes', () => {
        const { rerender } = renderAudioPlayer('jabra');

        mockUseMeetSelector.mockReturnValue('airpods');
        rerender();

        expect(MockAudio.instances).toHaveLength(1);
        expect(getAudio().setSinkId).toHaveBeenLastCalledWith('airpods');
    });

    it('pins the system default output', () => {
        renderAudioPlayer('');

        expect(getAudio().setSinkId).toHaveBeenCalledWith('');
    });

    it('leaves the sink untouched until the meeting has an output', () => {
        const { result } = renderAudioPlayer(null);

        result.current.playAudio();

        expect(getAudio().setSinkId).not.toHaveBeenCalled();
        expect(getAudio().play).toHaveBeenCalled();
    });

    it('skips routing when the browser has no setSinkId support', () => {
        mockSupportsSetSinkId.mockReturnValue(false);
        const { result } = renderAudioPlayer('jabra');

        result.current.playAudio();

        expect(getAudio().setSinkId).not.toHaveBeenCalled();
        expect(getAudio().play).toHaveBeenCalled();
    });

    it('still plays when the output cannot be applied', () => {
        const { result } = renderAudioPlayer('unplugged');
        getAudio().setSinkId.mockRejectedValueOnce(new Error('NotFoundError'));

        result.current.playAudio();

        expect(getAudio().play).toHaveBeenCalled();
    });
});

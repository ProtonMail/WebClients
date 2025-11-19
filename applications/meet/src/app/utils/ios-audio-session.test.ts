import { describe, expect, it, vi } from 'vitest';

import {
    getAudioSessionType,
    isAudioSessionAvailable,
    setAudioSessionType,
    withIOSAudioSessionWorkaround,
} from './ios-audio-session';

describe('ios-audio-session', () => {
    describe('isAudioSessionAvailable', () => {
        it('should return false when navigator.audioSession is not available', () => {
            expect(isAudioSessionAvailable()).toBe(false);
        });

        it('should return true when navigator.audioSession is available', () => {
            // Mock iOS Safari's audioSession API
            Object.defineProperty(navigator, 'audioSession', {
                value: { type: 'auto' },
                configurable: true,
            });

            expect(isAudioSessionAvailable()).toBe(true);

            // Cleanup
            delete (navigator as any).audioSession;
        });
    });

    describe('getAudioSessionType', () => {
        it('should return null when audioSession is not available', () => {
            expect(getAudioSessionType()).toBeNull();
        });

        it('should return current audio session type when available', () => {
            Object.defineProperty(navigator, 'audioSession', {
                value: { type: 'play-and-record' },
                configurable: true,
            });

            expect(getAudioSessionType()).toBe('play-and-record');

            delete (navigator as any).audioSession;
        });
    });

    describe('setAudioSessionType', () => {
        it('should do nothing when audioSession is not available', () => {
            expect(() => setAudioSessionType('playback')).not.toThrow();
        });

        it('should set audio session type when available', () => {
            const mockAudioSession = { type: 'auto' as any };
            Object.defineProperty(navigator, 'audioSession', {
                value: mockAudioSession,
                configurable: true,
            });

            setAudioSessionType('play-and-record');
            expect(mockAudioSession.type).toBe('play-and-record');

            delete (navigator as any).audioSession;
        });
    });

    describe('withIOSAudioSessionWorkaround', () => {
        it('should call getUserMedia normally when audioSession is not available', async () => {
            const mockGetUserMedia = vi.fn().mockResolvedValue('mock-stream');

            const result = await withIOSAudioSessionWorkaround(mockGetUserMedia);

            expect(result).toBe('mock-stream');
            expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
        });

        it('should apply audioSession workaround when available', async () => {
            const mockAudioSession = { type: 'auto' as any };
            Object.defineProperty(navigator, 'audioSession', {
                value: mockAudioSession,
                configurable: true,
            });

            const mockGetUserMedia = vi.fn().mockResolvedValue('mock-stream');

            const result = await withIOSAudioSessionWorkaround(mockGetUserMedia);

            expect(result).toBe('mock-stream');
            expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
            // After the workaround, audioSession.type should be 'play-and-record'
            expect(mockAudioSession.type).toBe('play-and-record');

            delete (navigator as any).audioSession;
        });

        it('should reset audioSession on error', async () => {
            const mockAudioSession = { type: 'auto' as any };
            Object.defineProperty(navigator, 'audioSession', {
                value: mockAudioSession,
                configurable: true,
            });

            const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));

            await expect(withIOSAudioSessionWorkaround(mockGetUserMedia)).rejects.toThrow('Permission denied');
            // On error, audioSession should be reset to 'auto'
            expect(mockAudioSession.type).toBe('auto');

            delete (navigator as any).audioSession;
        });
    });
});

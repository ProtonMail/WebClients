import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsBackgroundEffectsSupported } from './useIsBackgroundEffectsSupported';

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const browserMocks = vi.hoisted(() => ({ isMobile: vi.fn(() => false) }));
vi.mock('@proton/shared/lib/helpers/browser', () => browserMocks);

const supportMocks = vi.hoisted(() => ({ supportsBackgroundEffects: vi.fn(() => true) }));
vi.mock('../../processors/background-processor/createBackgroundProcessor', () => supportMocks);

describe('useIsBackgroundEffectsSupported', () => {
    beforeEach(() => {
        unleashMocks.useFlag.mockReturnValue(true);
        browserMocks.isMobile.mockReturnValue(false);
        supportMocks.supportsBackgroundEffects.mockReturnValue(true);
    });

    it('should report the browser capability on desktop, whatever the mobile flag says', () => {
        unleashMocks.useFlag.mockReturnValue(false);

        const { result } = renderHook(() => useIsBackgroundEffectsSupported());

        expect(result.current).toBe(true);
    });

    it('should report unsupported on desktop when the browser cannot run the processors', () => {
        supportMocks.supportsBackgroundEffects.mockReturnValue(false);

        const { result } = renderHook(() => useIsBackgroundEffectsSupported());

        expect(result.current).toBe(false);
    });

    it('should report unsupported on mobile while the flag is off', () => {
        browserMocks.isMobile.mockReturnValue(true);
        unleashMocks.useFlag.mockReturnValue(false);

        const { result } = renderHook(() => useIsBackgroundEffectsSupported());

        expect(result.current).toBe(false);
    });

    it('should fall back to the browser capability on mobile once the flag is on', () => {
        browserMocks.isMobile.mockReturnValue(true);

        const { result } = renderHook(() => useIsBackgroundEffectsSupported());

        expect(result.current).toBe(true);

        supportMocks.supportsBackgroundEffects.mockReturnValue(false);

        expect(renderHook(() => useIsBackgroundEffectsSupported()).result.current).toBe(false);
    });
});

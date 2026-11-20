import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import useOpenDrawerOnLoad from '@proton/components/hooks/drawer/useOpenDrawerOnLoad';

import { useContactsListener } from '../../hooks/contact/useContactsListener';
import { useConversationsEvent } from '../../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../../hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from '../../hooks/incomingDefaults/useIncomingDefaultsEvents';
import { usePageHotkeys } from '../../hooks/mailbox/usePageHotkeys';
import useComposerEvent from '../../hooks/useComposerEvent';
import { useMailPTTMetric } from '../../metrics/useMailPTTMetric';
import { useAppShellSideEffects } from './useAppShellSideEffects';

vi.mock('@proton/components/hooks/drawer/useOpenDrawerOnLoad', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('../../hooks/contact/useContactsListener', () => ({
    useContactsListener: vi.fn(),
}));
vi.mock('../../hooks/events/useConversationsEvents', () => ({
    useConversationsEvent: vi.fn(),
}));
vi.mock('../../hooks/events/useMessagesEvents', () => ({
    useMessagesEvents: vi.fn(),
}));
vi.mock('../../hooks/incomingDefaults/useIncomingDefaultsEvents', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('../../hooks/mailbox/usePageHotkeys', () => ({
    usePageHotkeys: vi.fn(),
}));
vi.mock('../../hooks/useComposerEvent', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('../../metrics/useMailPTTMetric', () => ({
    useMailPTTMetric: vi.fn(),
}));
// Needs a router; @testing-library/react-hooks used to swallow its error into result.error
vi.mock('./useMailNavigationLogger', () => ({
    useMailNavigationLogger: vi.fn(),
}));

const openShortcutsModal = vi.fn();

describe('useAppShellSideEffects', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call all hooks with the correct parameters', () => {
        renderHook(() => useAppShellSideEffects({ openShortcutsModal }));

        expect(useOpenDrawerOnLoad).toHaveBeenCalled();
        expect(useContactsListener).toHaveBeenCalled();
        expect(useConversationsEvent).toHaveBeenCalled();
        expect(useMessagesEvents).toHaveBeenCalled();
        expect(useMailPTTMetric).toHaveBeenCalled();
        expect(useIncomingDefaultsEvents).toHaveBeenCalled();
        expect(useComposerEvent).toHaveBeenCalled();
        expect(usePageHotkeys).toHaveBeenCalledWith({
            onOpenShortcutsModal: expect.any(Function),
        });
    });

    it('should pass a callback to usePageHotkeys that calls openShortcutsModal with true', () => {
        renderHook(() => useAppShellSideEffects({ openShortcutsModal }));

        const callback = (usePageHotkeys as Mock).mock.calls[0][0].onOpenShortcutsModal;
        callback();

        expect(openShortcutsModal).toHaveBeenCalledWith(true);
    });

    it('should update callback references when props change', () => {
        const initialOpenShortcutsModal = vi.fn();

        const { rerender } = renderHook((props) => useAppShellSideEffects(props), {
            initialProps: { openShortcutsModal: initialOpenShortcutsModal },
        });

        const updatedOpenShortcutsModal = vi.fn();
        rerender({ openShortcutsModal: updatedOpenShortcutsModal });

        const latestCallback = (usePageHotkeys as Mock).mock.calls[1][0].onOpenShortcutsModal;

        latestCallback();

        expect(updatedOpenShortcutsModal).toHaveBeenCalledWith(true);
        expect(initialOpenShortcutsModal).not.toHaveBeenCalled();
    });
});

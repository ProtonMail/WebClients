import { renderHook } from '@testing-library/react-hooks';

import { useOpenDrawerOnLoad } from '@proton/components';

import { useContactsListener } from 'proton-mail/hooks/contact/useContactsListener';
import { useConversationsEvent } from 'proton-mail/hooks/events/useConversationsEvents';
import { useMessagesEvents } from 'proton-mail/hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from 'proton-mail/hooks/incomingDefaults/useIncomingDefaultsEvents';
import { usePageHotkeys } from 'proton-mail/hooks/mailbox/usePageHotkeys';
import useComposerEvent from 'proton-mail/hooks/useComposerEvent';
import { useMailPTTMetric } from 'proton-mail/metrics/useMailPTTMetric';

import { useAppShellSideEffects } from './useAppShellSideEffects';

jest.mock('@proton/components', () => ({
    useOpenDrawerOnLoad: jest.fn(),
}));
jest.mock('proton-mail/hooks/contact/useContactsListener', () => ({
    useContactsListener: jest.fn(),
}));
jest.mock('proton-mail/hooks/events/useConversationsEvents', () => ({
    useConversationsEvent: jest.fn(),
}));
jest.mock('proton-mail/hooks/events/useMessagesEvents', () => ({
    useMessagesEvents: jest.fn(),
}));
jest.mock('proton-mail/hooks/incomingDefaults/useIncomingDefaultsEvents', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('proton-mail/hooks/mailbox/usePageHotkeys', () => ({
    usePageHotkeys: jest.fn(),
}));
jest.mock('proton-mail/hooks/useComposerEvent', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('proton-mail/metrics/useMailPTTMetric', () => ({
    useMailPTTMetric: jest.fn(),
}));

const openShortcutsModal = jest.fn();

describe('useAppShellSideEffects', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

        const callback = (usePageHotkeys as jest.Mock).mock.calls[0][0].onOpenShortcutsModal;
        callback();

        expect(openShortcutsModal).toHaveBeenCalledWith(true);
    });

    it('should update callback references when props change', () => {
        const initialOpenShortcutsModal = jest.fn();

        const { rerender } = renderHook((props) => useAppShellSideEffects(props), {
            initialProps: { openShortcutsModal: initialOpenShortcutsModal },
        });

        const updatedOpenShortcutsModal = jest.fn();
        rerender({ openShortcutsModal: updatedOpenShortcutsModal });

        const latestCallback = (usePageHotkeys as jest.Mock).mock.calls[1][0].onOpenShortcutsModal;

        latestCallback();

        expect(updatedOpenShortcutsModal).toHaveBeenCalledWith(true);
        expect(initialOpenShortcutsModal).not.toHaveBeenCalled();
    });
});

import { c } from 'ttag';

import {
    MAX_ASSETS_PER_SPACE,
    MAX_CONVERSATIONS_PER_SPACE,
    MAX_MESSAGES_PER_CONVERSATION,
    MAX_SPACES_PER_USER,
} from '../../constants/limits';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import type { DebugLimitOverride } from '../../redux/slices/meta/errors';
import {
    addResourceLimitError,
    clearAllDebugLimitOverrides,
    selectAllDebugLimitOverrides,
    setDebugLimitOverride,
} from '../../redux/slices/meta/errors';
import { isNativeComposerBridgeAvailable, onLimitReachedError } from '../../remote/nativeComposerBridgeHelpers';
import { handleGenerationError } from '../../services/errors/errorHandling';
import type { ConversationId, SpaceId } from '../../types';
import { LUMO_API_ERRORS } from '../../types';

const overrideLabel = (override: DebugLimitOverride) => {
    if (override === 'approaching') return 'APPROACHING';
    if (override === 'at') return 'AT LIMIT';
    return 'off';
};

type Resource = 'messages' | 'assets' | 'conversations' | 'spaces';

interface NotificationsTabProps {
    currentConversationId: ConversationId | undefined;
    currentSpaceId: SpaceId | undefined;
}

export const NotificationsTab = ({ currentConversationId, currentSpaceId }: NotificationsTabProps) => {
    const dispatch = useLumoDispatch();
    const debugOverrides = useLumoSelector(selectAllDebugLimitOverrides);
    const { lumoUserType } = useLumoPlan();

    const triggerLimitError = (resource: Resource, limit: number) => {
        dispatch(
            addResourceLimitError({
                resource,
                limit,
                serverMessage: `[debug] Simulated 422 from backend for ${resource}`,
            })
        );
    };

    const triggerNativeBridgeLimit = (resource: Resource, limit: number) => {
        onLimitReachedError({
            resource,
            limit,
            message: `[debug] Direct native bridge test for ${resource}`,
        });
        if (!isNativeComposerBridgeAvailable()) {
            console.info(
                '[DebugView] Native composer bridge unavailable. The call was a no-op — check DevTools under a mobile wrapper to see the event reach native.'
            );
        }
    };

    const cycleOverride = (resource: Resource, current: DebugLimitOverride) => {
        const next: DebugLimitOverride =
            // eslint-disable-next-line no-nested-ternary
            current === null ? 'approaching' : current === 'approaching' ? 'at' : null;
        dispatch(
            setDebugLimitOverride({
                resource,
                override: next,
                conversationId: resource === 'messages' ? currentConversationId : undefined,
                spaceId: resource === 'assets' ? currentSpaceId : undefined,
            })
        );
    };

    const triggerGenerationError = (errorType: LUMO_API_ERRORS) => {
        if (!currentConversationId) {
            console.warn('[DebugView] No current conversation ID available for generation error');
            return;
        }

        dispatch(
            handleGenerationError(
                {
                    type: errorType,
                    conversationId: currentConversationId,
                    originalMessage: { type: 'error' } as any,
                    actionParams: {
                        actionType: 'send',
                        isWebSearchButtonToggled: false,
                    } as any,
                },
                lumoUserType
            )
        );
    };

    return (
        <div className="debug-view-tab-panel">
            <div className="debug-view-header">
                <span className="debug-view-header-icon">🚧</span>
                {c('lumo: Debug View').t`Resource limit notifications`}
            </div>
            <div className="debug-view-actions">
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerLimitError('messages', MAX_MESSAGES_PER_CONVERSATION)}
                >
                    💬 {c('lumo: Debug View').t`Trigger messages limit`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerLimitError('assets', MAX_ASSETS_PER_SPACE)}
                >
                    📎 {c('lumo: Debug View').t`Trigger assets limit`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerLimitError('conversations', MAX_CONVERSATIONS_PER_SPACE)}
                >
                    🗂️ {c('lumo: Debug View').t`Trigger conversations limit`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerLimitError('spaces', MAX_SPACES_PER_USER)}
                >
                    🌌 {c('lumo: Debug View').t`Trigger spaces limit`}
                </button>
                <div className="debug-view-hint">
                    {c('lumo: Debug View')
                        .t`Dispatches a simulated 422 limit error, which will be surfaced by the in-app notifier.`}
                </div>
            </div>

            <div className="debug-view-header" style={{ marginTop: '12px' }}>
                <span className="debug-view-header-icon">📱</span>
                {c('lumo: Debug View').t`Native bridge: onLimitReachedError`}
            </div>
            <div className="debug-view-actions">
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerNativeBridgeLimit('messages', MAX_MESSAGES_PER_CONVERSATION)}
                >
                    💬 {c('lumo: Debug View').t`Send messages limit to native`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerNativeBridgeLimit('assets', MAX_ASSETS_PER_SPACE)}
                >
                    📎 {c('lumo: Debug View').t`Send assets limit to native`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerNativeBridgeLimit('conversations', MAX_CONVERSATIONS_PER_SPACE)}
                >
                    🗂️ {c('lumo: Debug View').t`Send conversations limit to native`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerNativeBridgeLimit('spaces', MAX_SPACES_PER_USER)}
                >
                    🌌 {c('lumo: Debug View').t`Send spaces limit to native`}
                </button>
                <div className="debug-view-hint">
                    {isNativeComposerBridgeAvailable()
                        ? c('lumo: Debug View')
                              .t`Calls NativeComposerApi.onLimitReachedError directly (skips the toast flow).`
                        : c('lumo: Debug View')
                              .t`Native composer bridge not detected — calls will be logged but no-op. Open the app inside the iOS/Android wrapper to exercise the bridge.`}
                </div>
            </div>

            <div className="debug-view-header" style={{ marginTop: '12px' }}>
                <span className="debug-view-header-icon">📏</span>
                {c('lumo: Debug View').t`Composer limit banner preview`}
            </div>
            <div className="debug-view-actions">
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => cycleOverride('messages', debugOverrides.messages.override)}
                >
                    💬 {c('lumo: Debug View').t`Messages`}: {overrideLabel(debugOverrides.messages.override)}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => cycleOverride('assets', debugOverrides.assets.override)}
                >
                    📎 {c('lumo: Debug View').t`Assets`}: {overrideLabel(debugOverrides.assets.override)}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => dispatch(clearAllDebugLimitOverrides())}
                >
                    🧹 {c('lumo: Debug View').t`Clear overrides`}
                </button>
                <div className="debug-view-hint">
                    {c('lumo: Debug View')
                        .t`Forces the inline composer banner into "approaching" or "at limit" state so you can preview it in any context.`}
                </div>
            </div>

            <div className="debug-view-header" style={{ marginTop: '12px' }}>
                <span className="debug-view-header-icon">⚠️</span>
                {c('lumo: Debug View').t`Generation errors`}
            </div>
            <div className="debug-view-actions">
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerGenerationError(LUMO_API_ERRORS.GENERATION_REJECTED)}
                    disabled={!currentConversationId}
                >
                    🚦 {c('lumo: Debug View').t`Trigger generation rejected`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerGenerationError(LUMO_API_ERRORS.HIGH_DEMAND)}
                    disabled={!currentConversationId}
                >
                    🚌 {c('lumo: Debug View').t`Trigger high demand`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerGenerationError(LUMO_API_ERRORS.HARMFUL_CONTENT)}
                    disabled={!currentConversationId}
                >
                    🛡️ {c('lumo: Debug View').t`Trigger harmful content`}
                </button>
                <button
                    className="debug-view-btn debug-view-btn--secondary"
                    onClick={() => triggerGenerationError(LUMO_API_ERRORS.STREAM_DISCONNECTED)}
                    disabled={!currentConversationId}
                >
                    🔌 {c('lumo: Debug View').t`Trigger stream disconnected`}
                </button>
                <div className="debug-view-hint">
                    {currentConversationId
                        ? c('lumo: Debug View')
                              .t`Triggers generation error messages with tier-specific messaging. User type: ${lumoUserType}`
                        : c('lumo: Debug View').t`Open a conversation to enable generation error testing.`}
                </div>
            </div>
        </div>
    );
};

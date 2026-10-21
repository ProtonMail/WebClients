import { act, render } from '@testing-library/react';

import { useQueryParam } from '../../../hooks/useQueryParam';
import { sendArtifactFullscreenToggledEvent, sendArtifactPanelOpenedEvent } from '../../../util/telemetry';
import { ArtifactProvider, useArtifactContext } from './ArtifactContext';
import type { ArtifactRegistry } from './artifactRegistry';
import { useArtifactRegistry } from './useArtifactRegistry';

jest.mock('../../../hooks/useQueryParam', () => {
    return { useQueryParam: jest.fn() };
});

jest.mock('../../../hooks/useLumoFlags', () => {
    return {
        useLumoFlags: () => {
            return { artifactsView: false };
        },
    };
});

jest.mock('../../../redux/hooks', () => {
    return {
        useLumoDispatch: () => {
            return jest.fn();
        },
    };
});

jest.mock('../../../providers/RightPanelProvider', () => {
    return {
        useOptionalRightPanel: () => {
            return undefined;
        },
    };
});

jest.mock('../../../providers/ArtifactPanelHostProvider', () => {
    return {
        useOptionalArtifactPanelHostActions: () => {
            return undefined;
        },
    };
});

jest.mock('../../../util/telemetry', () => {
    return {
        bucketArtifactPanelOpenDuration: () => {
            return 'lt_10s';
        },
        capArtifactPosition: (position: number) => {
            return position;
        },
        sendArtifactCreatedEvent: jest.fn(),
        sendArtifactFullscreenToggledEvent: jest.fn(),
        sendArtifactPanelClosedEvent: jest.fn(),
        sendArtifactPanelOpenedEvent: jest.fn(),
        sendArtifactRevisedEvent: jest.fn(),
        sendArtifactToolCallInvalidEvent: jest.fn(),
    };
});

jest.mock('./artifactVersionTelemetry', () => {
    return {
        collectArtifactVersionTelemetry: () => {
            return { events: [], consumedMessageIds: [] };
        },
        consumeArtifactTelemetryLiveMessages: jest.fn(),
        getArtifactTelemetryLiveMessages: () => {
            return [];
        },
    };
});

jest.mock('./artifactAssetSyncSupport', () => {
    return {
        artifactTypeSupportsAssetSync: () => {
            return false;
        },
    };
});

jest.mock('./useArtifactRegistry', () => {
    return { useArtifactRegistry: jest.fn() };
});

const useQueryParamMock = useQueryParam as jest.Mock;
const useArtifactRegistryMock = useArtifactRegistry as jest.Mock;
const sendPanelOpenedMock = sendArtifactPanelOpenedEvent as jest.Mock;

const createEntry = (id: string) => {
    return {
        id,
        type: 'document',
        title: id,
        versions: [
            { messageId: `msg-${id}`, content: 'Hello', createdAt: '2026-10-19T00:00:00.000Z', source: 'model' },
        ],
    };
};

const createRegistry = (ids: string[]): ArtifactRegistry => {
    return Object.fromEntries(
        ids.map((id) => {
            return [id, createEntry(id)];
        })
    ) as unknown as ArtifactRegistry;
};

type ArtifactContextValue = ReturnType<typeof useArtifactContext>;

interface ProbeProps {
    onRender: (value: ArtifactContextValue) => void;
}

const Probe = ({ onRender }: ProbeProps) => {
    onRender(useArtifactContext());
    return null;
};

interface HarnessProps {
    conversationId: string;
    onRender: (value: ArtifactContextValue) => void;
}

const Harness = ({ conversationId, onRender }: HarnessProps) => {
    return (
        <ArtifactProvider conversationId={conversationId} linearChain={[]}>
            <Probe onRender={onRender} />
        </ArtifactProvider>
    );
};

const renderProvider = (conversationId = 'conv-1') => {
    const result = { current: null as unknown as ArtifactContextValue };
    const onRender = (value: ArtifactContextValue) => {
        result.current = value;
    };
    const view = render(<Harness conversationId={conversationId} onRender={onRender} />);
    const rerender = ({ conversationId: nextConversationId }: { conversationId: string }) => {
        view.rerender(<Harness conversationId={nextConversationId} onRender={onRender} />);
    };
    return { result, rerender };
};

describe('ArtifactProvider ?artifact= deep link', () => {
    beforeEach(() => {
        sendPanelOpenedMock.mockClear();
        useQueryParamMock.mockReturnValue('deep');
        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep']));
    });

    it('opens the deep-linked creation', () => {
        const { result } = renderProvider();

        expect(result.current.selectedId).toBe('deep');
        expect(sendPanelOpenedMock).toHaveBeenCalledTimes(1);
    });

    it('waits for the creation to appear in the registry before opening it', () => {
        useArtifactRegistryMock.mockReturnValue(createRegistry([]));
        const { result, rerender } = renderProvider();
        expect(result.current.selectedId).toBeNull();

        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep']));
        rerender({ conversationId: 'conv-1' });

        expect(result.current.selectedId).toBe('deep');
    });

    it('does not reopen after the user closes the panel and the registry changes', () => {
        const { result, rerender } = renderProvider();

        act(() => {
            result.current.closePanel();
        });
        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep', 'other']));
        rerender({ conversationId: 'conv-1' });

        expect(result.current.selectedId).toBeNull();
        expect(result.current.panelUserClosed).toBe(true);
        expect(sendPanelOpenedMock).toHaveBeenCalledTimes(1);
    });

    it('does not switch away from a creation the user picked when the registry changes', () => {
        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep', 'other']));
        const { result, rerender } = renderProvider();

        act(() => {
            result.current.openArtifact('other', undefined, 'chip');
        });
        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep', 'other', 'third']));
        rerender({ conversationId: 'conv-1' });

        expect(result.current.selectedId).toBe('other');
    });

    it('opens the same creation id again in another conversation', () => {
        const { result, rerender } = renderProvider('conv-1');
        act(() => {
            result.current.closePanel();
        });

        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep']));
        rerender({ conversationId: 'conv-2' });

        expect(result.current.selectedId).toBe('deep');
        expect(sendPanelOpenedMock).toHaveBeenCalledTimes(2);
    });

    it('opens again after the param is cleared and set again', () => {
        const { result, rerender } = renderProvider();
        act(() => {
            result.current.closePanel();
        });

        useQueryParamMock.mockReturnValue(null);
        rerender({ conversationId: 'conv-1' });
        expect(result.current.selectedId).toBeNull();

        useQueryParamMock.mockReturnValue('deep');
        rerender({ conversationId: 'conv-1' });
        expect(result.current.selectedId).toBe('deep');
    });
});

describe('ArtifactProvider fullscreen telemetry', () => {
    const sendFullscreenToggledMock = sendArtifactFullscreenToggledEvent as jest.Mock;

    beforeEach(() => {
        sendFullscreenToggledMock.mockClear();
        useQueryParamMock.mockReturnValue('deep');
        useArtifactRegistryMock.mockReturnValue(createRegistry(['deep']));
    });

    it('counts each real enter and exit once', () => {
        const { result } = renderProvider();

        act(() => {
            result.current.enterFullscreen();
        });
        act(() => {
            result.current.enterFullscreen();
        });
        act(() => {
            result.current.exitFullscreen();
        });
        act(() => {
            result.current.exitFullscreen();
        });

        expect(sendFullscreenToggledMock.mock.calls).toEqual([[{ entered: true }], [{ entered: false }]]);
    });

    it('does not count leaving fullscreen by closing the panel', () => {
        const { result } = renderProvider();

        act(() => {
            result.current.enterFullscreen();
        });
        act(() => {
            result.current.closePanel();
        });

        expect(result.current.isFullscreen).toBe(false);
        expect(sendFullscreenToggledMock.mock.calls).toEqual([[{ entered: true }]]);
    });
});

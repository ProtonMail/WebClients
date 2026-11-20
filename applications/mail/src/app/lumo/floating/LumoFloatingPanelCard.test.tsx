import { fireEvent, render, screen } from '@testing-library/react';

import ConnectedLumoAgentPanel from '@proton/llm/lib/lumoAgent/ui/ConnectedLumoAgentPanel';

import LumoFloatingPanelCard from './LumoFloatingPanelCard';

vi.mock('@proton/llm/lib/lumoAgent/ui/ConnectedLumoAgentPanel', () => ({
    __esModule: true,
    default: vi.fn(() => <button type="button">transcript</button>),
}));

const onClose = vi.fn();
const onOuterKeyDown = vi.fn();

const renderCard = () => {
    render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={onOuterKeyDown}>
            <LumoFloatingPanelCard onClose={onClose} />
        </div>
    );
    return screen.getByRole('button', { name: 'transcript' });
};

beforeEach(() => vi.clearAllMocks());

describe('LumoFloatingPanelCard', () => {
    it('renders the transcript without its own prompt, thinking row or idle mark, closing through the host', () => {
        renderCard();

        expect(vi.mocked(ConnectedLumoAgentPanel).mock.lastCall![0]).toEqual({
            onClose,
            showPromptInput: false,
            showThinking: false,
            showIdleMark: false,
        });
    });

    it('closes on Escape inside the card without letting it reach the page', () => {
        fireEvent.keyDown(renderCard(), { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onOuterKeyDown).not.toHaveBeenCalled();
    });

    it('ignores other keys', () => {
        fireEvent.keyDown(renderCard(), { key: 'Enter' });

        expect(onClose).not.toHaveBeenCalled();
        expect(onOuterKeyDown).toHaveBeenCalledTimes(1);
    });
});

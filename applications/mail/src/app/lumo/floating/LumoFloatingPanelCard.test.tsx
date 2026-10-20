import { fireEvent, render, screen } from '@testing-library/react';

import ConnectedLumoAgentPanel from '@proton/llm/lib/lumoAgent/ui/ConnectedLumoAgentPanel';

import LumoFloatingPanelCard from './LumoFloatingPanelCard';

jest.mock('@proton/llm/lib/lumoAgent/ui/ConnectedLumoAgentPanel', () => ({
    __esModule: true,
    default: jest.fn(() => <button type="button">transcript</button>),
}));

const onClose = jest.fn();
const onOuterKeyDown = jest.fn();

const renderCard = () => {
    render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onKeyDown={onOuterKeyDown}>
            <LumoFloatingPanelCard onClose={onClose} />
        </div>
    );
    return screen.getByRole('button', { name: 'transcript' });
};

beforeEach(() => jest.clearAllMocks());

describe('LumoFloatingPanelCard', () => {
    it('renders the transcript without its own prompt or thinking row, closing through the host', () => {
        renderCard();

        expect(jest.mocked(ConnectedLumoAgentPanel).mock.lastCall![0]).toEqual({
            onClose,
            showPromptInput: false,
            showThinking: false,
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

import React from 'react';
import SignToggle from './SignToggle';
import { render, fireEvent, act, waitForDomChange } from 'react-testing-library';
import { ApiContext } from 'react-components';

describe('SignToggle component', () => {
    it('should render the component', () => {
        const { container } = render(<SignToggle id="sign" sign={1} />);
        const toggleNode = container.querySelector('.pm-toggle-checkbox');

        expect(toggleNode).not.toBe(null);
        expect(toggleNode.getAttribute('checked')).toBe('');
    });

    it('should call the API and the event manager', async () => {
        const mockApi = jest.fn();
        const { container } = render(
            <ApiContext.Provider value={mockApi}>
                <SignToggle id="sign" sign={1} />
            </ApiContext.Provider>
        );

        const toggleNode = container.querySelector('.pm-toggle-checkbox');

        act(() => {
            fireEvent.click(toggleNode);
            expect(mockApi).toHaveBeenCalledTimes(1);
            // TODO add check on event manager call once the hook is available
        });

        await waitForDomChange(toggleNode);

        expect(toggleNode.checked).toBe(false);
    });
});

import React from 'react';
import SignToggle from './SignToggle';
import { render, fireEvent, act, waitForDomChange } from 'react-testing-library';
import { ApiContext, EventManagerContext } from 'react-components';

describe('SignToggle component', () => {
    let mockEventManager;
    let mockApi;

    beforeEach(() => {
        mockApi = jest.fn();
        mockEventManager = { call: jest.fn() };
    });

    const wrap = (component) => {
        return (
            <ApiContext.Provider value={mockApi}>
                <EventManagerContext.Provider value={mockEventManager}>{component}</EventManagerContext.Provider>
            </ApiContext.Provider>
        );
    };

    it('should render the component', () => {
        const { container } = render(wrap(<SignToggle id="sign" sign={1} />));
        const toggleNode = container.querySelector('.pm-toggle-checkbox');

        expect(toggleNode).not.toBe(null);
        expect(toggleNode.getAttribute('checked')).toBe('');
    });

    it('should call the API and the event manager', async () => {
        const { container } = render(wrap(<SignToggle id="sign" sign={1} />));

        const toggleNode = container.querySelector('.pm-toggle-checkbox');

        act(() => {
            fireEvent.click(toggleNode);
        });
        await waitForDomChange(toggleNode);

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(mockEventManager.call).toHaveBeenCalledTimes(1);

        expect(toggleNode.checked).toBe(false);
    });
});

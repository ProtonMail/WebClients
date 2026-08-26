import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import type { BackgroundState } from '@proton/meet/store/slices/backgroundSlice';
import { backgroundReducer } from '@proton/meet/store/slices/backgroundSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { BackgroundEffectInitializingOverlay } from './BackgroundEffectInitializingOverlay';

const renderOverlay = (backgroundState: Partial<BackgroundState>) => {
    const store = configureStore({
        // @ts-expect-error - mock data
        reducer: { ...backgroundReducer },
        preloadedState: { background: backgroundState },
    });

    return render(
        <Provider context={ProtonStoreContext} store={store}>
            <BackgroundEffectInitializingOverlay />
        </Provider>
    );
};

describe('BackgroundEffectInitializingOverlay', () => {
    it('should not render when no background effect is initializing', () => {
        renderOverlay({ initializingBackgroundEffect: null, failedBackgroundEffect: null });

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should name blur while the blur pipeline warms up', () => {
        renderOverlay({ initializingBackgroundEffect: 'blur', failedBackgroundEffect: null });

        expect(screen.getByRole('status')).toHaveTextContent('Background blur initializing');
    });

    it('should name the virtual background while its pipeline warms up', () => {
        renderOverlay({ initializingBackgroundEffect: 'virtualBackground', failedBackgroundEffect: null });

        expect(screen.getByRole('status')).toHaveTextContent('Virtual background initializing');
    });

    it('should name the effect that failed to initialize', () => {
        renderOverlay({ initializingBackgroundEffect: null, failedBackgroundEffect: 'virtualBackground' });

        expect(screen.getByRole('alert')).toHaveTextContent('Virtual background initialization failed');
    });
});

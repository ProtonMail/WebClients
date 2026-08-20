import { render, screen } from '@testing-library/react';

import type { MediaManagementContextType } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { MediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { BackgroundEffectInitializingOverlay } from './BackgroundEffectInitializingOverlay';

const renderOverlay = (contextValue: Partial<MediaManagementContextType>) =>
    render(
        // @ts-expect-error - contextValue is a partial MediaManagementContextType
        <MediaManagementContext.Provider value={contextValue}>
            <BackgroundEffectInitializingOverlay />
        </MediaManagementContext.Provider>
    );

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

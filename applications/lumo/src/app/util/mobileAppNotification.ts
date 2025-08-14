/**
 * Utility for notifying mobile apps when the Lumo web application is fully loaded
 */

export interface LumoAppLoadedMessage {
    type: 'LUMO_APP_LOADED';
    timestamp: number;
    version?: string;
}

// Global flag to ensure notification is only sent once per page load
let hasNotifiedMobileApp = false;

/**
 * Sends a message to mobile apps (Android/iOS) indicating that the Lumo application
 * has finished loading and is ready for interaction.
 * 
 * This replaces the flaky lumo-input-container detection method.
 * Uses a global flag to ensure the notification is only sent once per page load.
 * 
 * @param delayMs - Delay in milliseconds before sending the message (default: 150ms)
 */
export const notifyMobileAppLoaded = (delayMs: number = 150): void => {
    // Prevent duplicate notifications
    if (hasNotifiedMobileApp) {
        console.log('Mobile app notification already sent, skipping duplicate');
        return;
    }
    
    hasNotifiedMobileApp = true;
    
    setTimeout(() => {
        const message: LumoAppLoadedMessage = {
            type: 'LUMO_APP_LOADED',
            timestamp: Date.now(),
            version: process.env.APP_VERSION || '1.0.0'
        };

        // Send message to Android WebView
        if (typeof (window as any).Android !== 'undefined') {
            try {
                (window as any).Android.onLumoAppLoaded(JSON.stringify(message));
            } catch (error) {
                console.warn('Failed to notify Android app:', error);
            }
        }

        // Send message to iOS WKWebView
        if (typeof (window as any).webkit?.messageHandlers?.lumoApp !== 'undefined') {
            try {
                (window as any).webkit.messageHandlers.lumoApp.postMessage(message);
            } catch (error) {
                console.warn('Failed to notify iOS app:', error);
            }
        }

        // Also dispatch a custom DOM event as a fallback
        try {
            window.dispatchEvent(new CustomEvent('lumo-app-loaded', { 
                detail: message 
            }));
        } catch (error) {
            console.warn('Failed to dispatch lumo-app-loaded event:', error);
        }

        console.log('Lumo app loaded notification sent to mobile apps', message);
    }, delayMs);
};

/**
 * For debugging: Listen for the lumo-app-loaded event
 */
export const addMobileAppLoadedListener = (callback: (message: LumoAppLoadedMessage) => void): (() => void) => {
    const handler = (event: CustomEvent<LumoAppLoadedMessage>) => {
        callback(event.detail);
    };
    
    window.addEventListener('lumo-app-loaded', handler as EventListener);
    
    // Return cleanup function
    return () => {
        window.removeEventListener('lumo-app-loaded', handler as EventListener);
    };
};

/**
 * For debugging: Reset the notification flag (useful for testing)
 */
export const resetMobileAppNotificationFlag = (): void => {
    hasNotifiedMobileApp = false;
    console.log('Mobile app notification flag reset');
}; 
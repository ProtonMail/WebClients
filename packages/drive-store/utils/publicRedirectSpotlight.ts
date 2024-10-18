// This module manages the logic for showing a spotlight on the public page on the "Open in Drive" button.
// The spotlight is designed to be shown only once to each user after they just "Saved" a public share in their Drive.
// It uses localStorage to track the spotlight's status across sessions.
// Status:
// - "pending": Waiting for the spotlight to be showed
// - "shown": Spotlight has been shown for this user

export const PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY = 'public-share-redirect-spotlight';
export enum PublicShareRedirectSpotlightStatus {
    Pending = 'pending',
    Shown = 'shown',
}
export const setPublicRedirectSpotlightToPending = () => {
    try {
        localStorage.setItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY, PublicShareRedirectSpotlightStatus.Pending);
    } catch (e) {
        console.warn(`localStorage was not available to set key ${PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY}`);
    }
};

export const setPublicRedirectSpotlightToShown = () => {
    try {
        localStorage.setItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY, PublicShareRedirectSpotlightStatus.Shown);
    } catch (e) {
        console.warn(`localStorage was not available to set key ${PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY}`);
    }
};

export const needPublicRedirectSpotlight = () => {
    try {
        return localStorage.getItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY) === PublicShareRedirectSpotlightStatus.Pending;
    } catch (e) {
        console.warn(`localStorage was not available to get key ${PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY}`);
        return false;
    }
};

export const publicRedirectSpotlightWasShown = () => {
    try {
        return localStorage.getItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY) === PublicShareRedirectSpotlightStatus.Shown;
    } catch (e) {
        console.warn(`localStorage was not available to get key ${PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY}`);
        return false;
    }
};

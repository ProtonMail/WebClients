import * as storage from '@proton/shared/lib/helpers/storage';

// This module manages the logic for showing a spotlight on the public page on the "Open in Drive" button.
// The spotlight is designed to be shown only once to each user after they just "Saved" a public share in their Drive.
// It uses localStorage to track the spotlight's status across sessions.
// Status:
// - "pending": Waiting for the spotlight to be showed
// - "shown": Spotlight has been shown for this user

const PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY = 'public-share-redirect-spotlight';
enum PublicShareRedirectSpotlightStatus {
    Pending = 'pending',
    Shown = 'shown',
}

export const setPublicRedirectSpotlightToShown = () =>
    storage.setItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY, PublicShareRedirectSpotlightStatus.Shown);

export const needPublicRedirectSpotlight = () =>
    storage.getItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY, 'false') === PublicShareRedirectSpotlightStatus.Pending;

export const publicRedirectSpotlightWasShown = () =>
    storage.getItem(PUBLIC_SHARE_REDIRECT_SPOTLIGHT_KEY, 'false') === PublicShareRedirectSpotlightStatus.Shown;

// Use to check if the user is eligible for free upload.
// It will return null in case the user is not (or no longer) eligible.
export function queryOnboardingStatus() {
    return {
        method: 'get',
        url: 'drive/v2/onboarding',
    };
}

// Tells you if the user has a timer running or not.
// If there is a timer running it'll tell you when the timer is ending.
export function queryFreshAccountStatus() {
    return {
        method: 'get',
        url: 'drive/v2/onboarding/fresh-account',
    };
}

// Call to start free upload timer.
// Returns a timestamp for when the user can’t upload for free anymore.
// If the user is not eligible null is returned.
export function queryUpdateFreshAccount() {
    return {
        method: 'post',
        url: 'drive/v2/onboarding/fresh-account',
    };
}

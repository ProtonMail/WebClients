/** Public landing page the social posts link back to. */
export const SHARE_URL = 'https://lumo.proton.me';

/** Default caption used for the post text / title. */
export const SHARE_TEXT =
    'Big Tech AI built a scarily accurate profile of me from my chat history. See what yours knows about you 👀';

export type SocialPlatform = 'x' | 'facebook' | 'reddit' | 'linkedin';

interface ShareIntentParams {
    url: string;
    text: string;
}

/**
 * Build a web "share intent" URL for a given platform. These open the platform's
 * compose window pre-filled with our text + link. Note: web intents cannot attach a
 * local image, so the generated card is downloaded separately for the user to attach.
 */
export const buildShareIntentUrl = (platform: SocialPlatform, { url, text }: ShareIntentParams): string => {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    switch (platform) {
        case 'x':
            return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
        case 'reddit':
            return `https://www.reddit.com/submit?url=${u}&title=${t}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    }
};

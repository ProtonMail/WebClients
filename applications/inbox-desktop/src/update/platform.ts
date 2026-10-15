import { DESKTOP_PLATFORMS } from "@proton/shared/lib/constants";

export const BASE_PLATFORM_UPDATE_FEED = "https://proton.me/download/mail";

export function getPlatformFeed(version: string, platform: DESKTOP_PLATFORMS): string | undefined {
    if (platform === DESKTOP_PLATFORMS.LINUX) return;

    return `${BASE_PLATFORM_UPDATE_FEED}/${platform}/${version}`;
}

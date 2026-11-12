declare global {
    interface Navigator {
        userAgentData?: {
            platform: string;
            getHighEntropyValues: (hints: string[]) => Promise<{ platformVersion?: string }>;
        };
    }
}

const FIRST_WINDOWS_11_MAJOR_PLATFORM_VERSION = 13;

export const isWindows10 = async () => {
    if (navigator.userAgentData?.platform !== 'Windows') {
        return false;
    }

    try {
        const { platformVersion = '' } = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
        const majorPlatformVersion = Number.parseInt(platformVersion.split('.')[0], 10);

        return majorPlatformVersion < FIRST_WINDOWS_11_MAJOR_PLATFORM_VERSION;
    } catch {
        return false;
    }
};

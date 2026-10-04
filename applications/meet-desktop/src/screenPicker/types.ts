export type ScreenPickerSourceType = "screen" | "window";

export interface ScreenPickerSource {
    id: string;
    type: ScreenPickerSourceType;
    name: string;
    subtitle?: string;
    thumbnail: string;
    appIcon?: string;
}

interface ScreenPickerLabels {
    title: string;
    screensTab: string;
    windowsTab: string;
    screensDescription: string;
    windowsDescription: string;
    showAdvanced: string;
    hideAdvanced: string;
    shareAudio: string;
    share: string;
    cancel: string;
    close: string;
    noWindows: string;
}

export interface ScreenPickerInit {
    labels: ScreenPickerLabels;
    showAudioToggle: boolean;
    // macOS blurs the meeting behind the overlay natively; elsewhere the backdrop is just darker.
    blurredBackdrop: boolean;
    defaultSourceId?: string;
}

export interface ScreenPickerSelection {
    id: string;
    shareAudio: boolean;
}

export interface ScreenPickerBridge {
    onInit: (callback: (init: ScreenPickerInit) => void) => void;
    onSources: (callback: (sources: ScreenPickerSource[]) => void) => void;
    select: (selection: ScreenPickerSelection) => void;
    cancel: () => void;
}

export const SCREEN_PICKER_CHANNELS = {
    init: "screenPicker:init",
    sources: "screenPicker:sources",
    select: "screenPicker:select",
    cancel: "screenPicker:cancel",
} as const;

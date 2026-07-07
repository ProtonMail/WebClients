export const PROTON_STATIC_COLOR_BAND_FIELD = '__lumoColorBand';

/** Proton chart design tokens — aligned with the Lumo / Proton Vega theme reference. */
export const PROTON_PURPLE = '#6D4AFF';
export const PROTON_PURPLE_DEEP = '#43239B';
export const PROTON_PURPLE_MID = '#A780FF';
export const PROTON_PURPLE_LIGHT = '#C494FF';
export const PROTON_PURPLE_TINT = '#EDE9F7';
export const PROTON_PURPLE_BG = '#F8F1FF';

export const PROTON_INK = '#1C1340';
export const PROTON_INK_DIM = '#6A6580';
export const PROTON_INK_FAINT = '#A49DC0';
export const PROTON_HAIRLINE = '#DAD3EF';

export const PROTON_VPN_GREEN = '#34C77B';
export const PROTON_CAL_BLUE = '#4F8EF7';
export const PROTON_DRIVE_RED = '#F26B4D';
export const PROTON_AMBER = '#F2B84B';
export const PROTON_NEUTRAL = '#A0B4C8';

/** Default categorical ramp — purple first, service accents only by name. */
export const PROTON_CATEGORY_COLORS = [
    PROTON_PURPLE,
    PROTON_VPN_GREEN,
    PROTON_CAL_BLUE,
    PROTON_DRIVE_RED,
    PROTON_PURPLE_LIGHT,
    PROTON_NEUTRAL,
    PROTON_AMBER,
    PROTON_PURPLE_DEEP,
] as const;

export const PROTON_PRODUCT_DOMAIN = ['Mail', 'Lumo', 'VPN', 'Calendar', 'Drive'] as const;
export const PROTON_PRODUCT_COLORS = [
    PROTON_PURPLE,
    PROTON_PURPLE_MID,
    PROTON_VPN_GREEN,
    PROTON_CAL_BLUE,
    PROTON_DRIVE_RED,
] as const;

export const PROTON_SEQUENTIAL_RAMP = [
    PROTON_PURPLE_BG,
    '#DAC7FF',
    PROTON_PURPLE_MID,
    PROTON_PURPLE,
    PROTON_PURPLE_DEEP,
] as const;

/** @deprecated Use PROTON_PURPLE — kept for existing imports. */
export const PROTON_BAR_COLOR = PROTON_PURPLE;
/** @deprecated Use PROTON_PURPLE */
export const PROTON_LINE_COLOR = PROTON_PURPLE;
/** @deprecated Use PROTON_PURPLE_MID */
export const PROTON_LINE_ACCENT = PROTON_PURPLE_MID;
/** @deprecated Use PROTON_CATEGORY_COLORS */
export const PROTON_CHART_COLORS = PROTON_CATEGORY_COLORS;

export const PROTON_FONT_BODY = 'Inter, system-ui, sans-serif';

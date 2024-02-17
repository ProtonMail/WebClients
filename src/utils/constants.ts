export type APP = "MAIL" | "CALENDAR";

export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;

export const PARTITION = "persist:app";

export const ALLOWED_PERMISSIONS = ["notifications", "clipboard-sanitized-write", "persistent-storage"];

export const STORE_WINDOW_KEY = "WindowsStore";

export const WINDOW_SIZES = {
    DEFAULT_WIDTH: 1024,
    DEFAULT_HEIGHT: 768,
    MIN_WIDTH: 768,
    MIN_HEIGHT: 576,
    NEW_WINDOW_SHIFT: 30,
};

export const CERT_PROTON_ME = [
    "CT56BhOTmj5ZIPgb/xD5mH8rY3BLo/MlhP7oPyJUEDo=", // Current
    "35Dx28/uzN3LeltkCBQ8RHK0tlNSa2kCpCRGNp34Gxc=", // Hot backup
    "qYIukVc63DEITct8sFT7ebIq5qsWmuscaIKeJx+5J5A=", // Cold backup
];

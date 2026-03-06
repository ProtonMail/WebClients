export type CTAModalBaseProps = {
    open: boolean;
    onClose: () => void;
    rejoin?: () => void;
    action: () => void;
};

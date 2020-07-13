export interface BreadcrumbInfo {
    key: string | number;
    text: string;
    collapsedText?: React.ReactNode;
    onClick?: () => void;
}

interface Props {
    leadingText: string;
    header: string;
    subline: string;
}

export const PostSignupHeader = ({ leadingText, header, subline }: Props) => {
    return (
        <div className="mb-4">
            <p className="mt-0 mb-1 text-sm text-semibold color-primary">{leadingText}</p>
            <h2 className="mb-1 text-bold text-lg">{header}</h2>
            <p className="m-0 text-sm color-weak">{subline}</p>
        </div>
    );
};

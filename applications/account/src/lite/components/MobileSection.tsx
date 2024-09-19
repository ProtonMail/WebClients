interface Props {
    title?: string;
    children: React.ReactNode;
}

const MobileSection = ({ title, children }: Props) => {
    return (
        <>
            {title && <h2 className="text-semibold text-lg mb-3 color-weak">{title}</h2>}
            <div className="mb-8 mobile-section">{children}</div>
        </>
    );
};

export default MobileSection;

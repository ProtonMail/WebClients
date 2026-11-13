interface Props {
    title?: string;
    description?: React.ReactNode;
    children: React.ReactNode;
}

const MobileSection = ({ title, description, children }: Props) => {
    return (
        <>
            {title && <h2 className="text-semibold text-lg mb-3">{title}</h2>}
            {description}
            <div className="mb-8 mobile-section">{children}</div>
        </>
    );
};

export default MobileSection;

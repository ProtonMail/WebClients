import './FloatingElements.scss';

export const FloatingElementsPublic = ({ children }: { children: React.ReactNode }) => {
    return (
        <div
            className="floating-elements fixed bottom-0 right-0 w-full items-end max-w-custom"
            style={{
                '--max-w-custom': '50em',
            }}
        >
            {children}
        </div>
    );
};

import type { ReactNode } from 'react';

const SafetyReviewCardHeaderIllustration = ({
    children,
    ...rest
}: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className="mb-3" {...rest}>
            {children}
        </div>
    );
};

const SafetyReviewCardHeaderTitle = ({
    children,
    ...rest
}: { children: ReactNode } & React.HTMLAttributes<HTMLHeadingElement>) => {
    return (
        <h3 className="m-0 text-semibold text-lg" {...rest}>
            {children}
        </h3>
    );
};

const SafetyReviewCardHeaderDescription = ({ children }: { children: ReactNode }) => {
    return <p className="m-0 self-start">{children}</p>;
};

interface SafetyReviewCardHeaderProps {
    children: ReactNode;
}

const SafetyReviewCardHeader = ({ children }: SafetyReviewCardHeaderProps) => {
    return <header className="flex flex-column justify-center items-center flex-nowrap gap-4 mb-6">{children}</header>;
};

SafetyReviewCardHeader.Illustration = SafetyReviewCardHeaderIllustration;
SafetyReviewCardHeader.Title = SafetyReviewCardHeaderTitle;
SafetyReviewCardHeader.Description = SafetyReviewCardHeaderDescription;

export { SafetyReviewCardHeader };

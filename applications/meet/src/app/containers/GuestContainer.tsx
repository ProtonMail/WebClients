import { ErrorBoundary, StandardErrorPage } from '@proton/components/index';

interface GuestContainerProps {
    children: React.ReactNode;
}

export const GuestContainer = ({ children }: GuestContainerProps) => {
    return (
        <ErrorBoundary big component={<StandardErrorPage big />}>
            {children}
        </ErrorBoundary>
    );
};

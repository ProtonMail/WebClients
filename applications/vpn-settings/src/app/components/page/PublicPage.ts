import { useEffect, ReactNode } from 'react';

type Props = {
    children: ReactNode;
    title: string;
};

const PublicPage = ({ children, title }: Props) => {
    useEffect(() => {
        document.title = `${title} - ProtonVPN`;
    }, [title]);

    return children;
};

export default PublicPage;

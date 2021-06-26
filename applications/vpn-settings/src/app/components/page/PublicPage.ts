import { ReactNode } from 'react';
import { useAppTitle } from 'react-components';

type Props = {
    children: ReactNode;
    title: string;
};

const PublicPage = ({ children, title }: Props) => {
    useAppTitle(title);
    return children;
};

export default PublicPage;

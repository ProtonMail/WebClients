import { useLocation } from 'react-router-dom';

export const useIsPublicContext = () => {
    const { pathname } = useLocation();
    const isPublicContext = pathname.startsWith('/urls');
    return isPublicContext;
};

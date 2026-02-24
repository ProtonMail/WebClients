import { Link as RouterLink, useLocation } from 'react-router-dom';

export const LumoLink = ({ to, ...props }: any) => {
    const location = useLocation();

    const currentPath = location.pathname;
    const sessionIdMatch = currentPath.match(/^\/u\/([^\/]+)/);

    let fullPath = to;
    if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        fullPath = `/u/${sessionId}${to}`;
    }

    return <RouterLink to={fullPath} {...props} style={{ textDecoration: 'none', color: 'inherit' }} />;
};

export default LumoLink;

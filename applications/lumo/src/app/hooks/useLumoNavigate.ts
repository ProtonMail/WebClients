import { useHistory } from 'react-router-dom';

export const useLumoNavigate = () => {
    const history = useHistory();
    return (path: string) => {
        history.push(path);
    };
};

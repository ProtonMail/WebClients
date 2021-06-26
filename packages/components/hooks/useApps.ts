import { APPS } from 'proton-shared/lib/constants';

const { PROTONMAIL, PROTONCALENDAR, PROTONDRIVE } = APPS;

const useApps = () => {
    return [PROTONMAIL, PROTONCALENDAR, PROTONDRIVE];
};

export default useApps;

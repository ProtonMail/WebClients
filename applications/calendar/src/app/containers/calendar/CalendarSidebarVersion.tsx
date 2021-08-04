import { AppVersion } from '@proton/components';
import changelog from '../../../../CHANGELOG.md';

const CalendarSidebarVersion = () => {
    return <AppVersion changelog={changelog} />;
};

export default CalendarSidebarVersion;

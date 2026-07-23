import type { IconName } from '../../components/LumoIcon/LumoIcon';

/** Map a report section title to a Lucide icon for consistent, scannable grouping. */
export const getPaperTrailSectionIcon = (title: string): IconName => {
    const normalized = title.toLowerCase();

    if (/name|identity/.test(normalized)) {
        return 'User';
    }
    if (/work|career|job|profession|employ/.test(normalized)) {
        return 'Briefcase';
    }
    if (/education|school|university|degree|study/.test(normalized)) {
        return 'GraduationCap';
    }
    if (/health|medical|diagnos|medic/.test(normalized)) {
        return 'HeartPulse';
    }
    if (/financ|money|income|debt|salary|spending/.test(normalized)) {
        return 'Wallet';
    }
    if (/politic|vote|party/.test(normalized)) {
        return 'Landmark';
    }
    if (/relationship|family|marital|partner|spouse|children|parent/.test(normalized)) {
        return 'Users';
    }
    if (/location|place|address|travel|city|country|live|home/.test(normalized)) {
        return 'MapPin';
    }
    if (/interest|hobbi|passion/.test(normalized)) {
        return 'Sparkles';
    }
    if (/technical|expertise|philosophy/.test(normalized)) {
        return 'Brain';
    }
    if (/organizational|organisation|organisational|dynamics.*culture|workplace culture/.test(normalized)) {
        return 'Network';
    }
    if (/communication|messaging style|writing style|tone of voice/.test(normalized)) {
        return 'MessagesSquare';
    }
    if (/age|life stage|demographic/.test(normalized)) {
        return 'Calendar';
    }

    return 'CircleDot';
};

import { AppsDropdown, UserDropdown } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { LumoHeader } from './HeaderWrapper';
import {LumoLogoThemeAware} from "../../components/Icons/LumoLogoThemeAware";

const { PROTONLUMO } = APPS;

export const LimitedLumoHeader = () => {
    return (
        <LumoHeader>
            <div className="md:flex-1 flex flex-row flex-nowrap items-center gap-2">
                <LumoLogoThemeAware height="36px" />
            </div>
            <div className="flex flex-nowrap items-center gap-4 no-print">
                <AppsDropdown app={PROTONLUMO} />
                <UserDropdown app={PROTONLUMO} />
            </div>
        </LumoHeader>
    );
};

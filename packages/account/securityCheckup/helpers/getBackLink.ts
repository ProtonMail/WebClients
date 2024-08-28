import { getAppFromHostname, getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import type { BackLink } from '@proton/shared/lib/interfaces/securityCheckup';

const getBackLink = ({ backHref, hostname }: { backHref: string; hostname: string }): BackLink => {
    const backUrl = new URL(backHref);

    if (getSecondLevelDomain(backUrl.hostname) !== getSecondLevelDomain(hostname)) {
        throw new Error();
    }

    return {
        appNameFromHostname: getAppFromHostname(backUrl.hostname),
        appName: getAppFromHostname(backUrl.hostname) || getAppFromPathnameSafe(backUrl.pathname),
        to: stripLocalBasenameFromPathname(backUrl.pathname),
        href: backUrl.href,
    };
};

export default getBackLink;

import type { AuthLog } from '@proton/shared/lib/authlog';

interface Props {
    appVersion: AuthLog['AppVersion'];
}

const AppVersionCell = ({ appVersion }: Props) => {
    if (appVersion === null) {
        return <span>-</span>;
    }

    const appVersionList = appVersion.split('@', 2);
    if (appVersionList.length > 1) {
        return (
            <span className="mt-2 color-weak">
                {appVersionList[0]}
                <br />
                {appVersionList[1]}
            </span>
        );
    }
    return <span className="mt-2 color-weak">{appVersion}</span>;
};

export default AppVersionCell;

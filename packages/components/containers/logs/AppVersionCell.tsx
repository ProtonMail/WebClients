import { AuthLog } from '@proton/shared/lib/authlog';

interface Props {
    appVersion: AuthLog['AppVersion'];
}

const AppVersionCell = ({ appVersion }: Props) => {
    if (appVersion === null) {
        return <span className="flex-1">-</span>;
    }

    const appVersionList = appVersion.split('@', 2);
    if (appVersionList.length > 1) {
        return (
            <span className="flex-1">
                {appVersionList[0]}
                <br />
                {appVersionList[1]}
            </span>
        );
    }
    return <span className="flex-1">{appVersion}</span>;
};

export default AppVersionCell;

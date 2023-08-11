import { AuthLog } from '@proton/shared/lib/authlog';

interface Props {
    appVersion: AuthLog['AppVersion'];
}

const AppVersionCell = ({ appVersion }: Props) => {
    const appVersionList = appVersion.split('@', 2);
    if (appVersionList.length > 1) {
        return (
            <span className="flex-item-fluid">
                {appVersionList[0]}
                <br />
                {appVersionList[1]}
            </span>
        );
    }
    return <span className="flex-item-fluid">{appVersion}</span>;
};

export default AppVersionCell;

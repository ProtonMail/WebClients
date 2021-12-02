import { Progress } from '@proton/components';
import { TransferStatePublic } from '@proton/shared/lib/interfaces/drive/sharing';

const DownloadProgressBar = ({ value, status }: { value: number; status: TransferStatePublic }) => {
    return (
        <>
            <Progress className={`progress-bar--${status}`} value={value} />
            <div className="mt1">{value} %</div>
        </>
    );
};

export default DownloadProgressBar;

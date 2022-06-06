import { useEffect, useState } from 'react';

import { DecryptedLink, useDownload } from '../../store';
import { isTransferActive } from '../../utils/transfer';

interface Props {
    items: DecryptedLink[];
}

export default function SharedFileBrowser({ items }: Props) {
    const { downloads, getDownloadsProgresses } = useDownload();

    const [progress, setProgress] = useState<number>();

    useEffect(() => {
        if (!downloads.some(isTransferActive)) {
            return;
        }

        const updateProgress = () => {
            const progresses = getDownloadsProgresses();
            setProgress(Object.values(progresses)[0]);
        };
        const id = setInterval(updateProgress, 500);
        return () => {
            clearInterval(id);
            // Update one more time to get latest progress in case download
            // is over and interval will not be restarted.
            updateProgress();
        };
    }, [downloads]);

    return (
        <>
            {items.map(({ name }) => name).join(', ')}
            <br />
            progress: {progress}
        </>
    );
}

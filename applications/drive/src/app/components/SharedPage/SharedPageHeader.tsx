import { c } from 'ttag';

import { Button } from '@proton/components';

export default function SharedPageHeader({
    children,
    onDownload,
}: {
    children: React.ReactNode;
    onDownload: () => void;
}) {
    return (
        <div className="flex flex-justify-space-between mb1">
            <h2 className="mb0 pb0 mr1">{children}</h2>
            <Button color="norm" onClick={onDownload}>{c('Action').t`Download`}</Button>
        </div>
    );
}

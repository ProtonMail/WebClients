import { c } from 'ttag';

interface Props {
    fromLabel: string;
    toLabel: string;
}

const ManageFoldersHeader = ({ fromLabel, toLabel }: Props) => {
    return (
        <>
            <div className="mb1 mt2">{c('Info').t`Please select the folders you would like to import:`}</div>

            <div className="flex pt1">
                <div className="flex-item-fluid text-ellipsis pr0-5" title={fromLabel}>
                    <strong>{fromLabel}</strong>
                </div>

                <div className="flex-item-fluid text-ellipsis pl0-5" title={toLabel}>
                    <strong>{toLabel}</strong>
                </div>
            </div>
        </>
    );
};

export default ManageFoldersHeader;

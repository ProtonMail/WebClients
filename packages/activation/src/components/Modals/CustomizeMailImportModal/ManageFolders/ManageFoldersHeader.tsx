import { c } from 'ttag';

interface Props {
    fromLabel: string;
    toLabel: string;
    isLabelMapping: boolean;
}

const ManageFoldersHeader = ({ fromLabel, toLabel, isLabelMapping }: Props) => {
    return (
        <>
            {isLabelMapping ? (
                <div className="mb-4 mt-8">{c('Info').t`Please select the labels you would like to import:`}</div>
            ) : (
                <div className="mb-4 mt-8">{c('Info').t`Please select the folders you would like to import:`}</div>
            )}

            <div className="flex pt-4">
                <div className="flex-1 text-ellipsis pr-2" title={fromLabel}>
                    <strong>{fromLabel}</strong>
                </div>

                <div className="flex-1 text-ellipsis pl-2" title={toLabel}>
                    <strong>{toLabel}</strong>
                </div>
            </div>
        </>
    );
};

export default ManageFoldersHeader;

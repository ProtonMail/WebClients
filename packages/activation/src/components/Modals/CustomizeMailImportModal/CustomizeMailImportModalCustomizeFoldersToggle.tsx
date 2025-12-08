import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, Label, Row } from '@proton/components';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcTags } from '@proton/icons/icons/IcTags';

interface Props {
    isLabelMapping: boolean;
    organizeFolderVisible: boolean;
    selectedFoldersCount: number;
    toggleFolderVisibility: () => void;
    totalFoldersCount: number;
}

const CustomizeMailImportModalCustomizeFoldersToggle = ({
    isLabelMapping,
    organizeFolderVisible,
    selectedFoldersCount,
    toggleFolderVisibility,
    totalFoldersCount,
}: Props) => {
    const t = EasyTrans.get(isLabelMapping);

    return (
        <div className="mb-4 items-center">
            <Row>
                <Label>{t.manage()}</Label>
                <Tooltip title={t.manage()}>
                    <Button shape="outline" onClick={toggleFolderVisibility} data-testid="CustomizeModal:toggleFolders">
                        <span>
                            {isLabelMapping ? <IcTags className="mr-2" /> : <IcFolders className="mr-2" />}
                            {selectedFoldersCount === totalFoldersCount ? (
                                <span>{t.totalCount(totalFoldersCount)}</span>
                            ) : (
                                <span>{t.partialCount(selectedFoldersCount)}</span>
                            )}
                        </span>
                        <Icon
                            alt={t.manage()}
                            name={organizeFolderVisible ? 'chevron-up-filled' : 'chevron-down-filled'}
                            className="ml-2"
                        />
                    </Button>
                </Tooltip>
            </Row>
        </div>
    );
};

export default CustomizeMailImportModalCustomizeFoldersToggle;

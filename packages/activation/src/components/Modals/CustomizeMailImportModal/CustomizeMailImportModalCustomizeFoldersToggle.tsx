import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';
import { Button } from '@proton/atoms/Button';
import { Icon, Label, Row } from '@proton/components/components';

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

    const toggleActionCopy = organizeFolderVisible ? t.hide() : t.show();

    return (
        <div className="mb1 border-bottom flex-align-items-center">
            <Row>
                <Label>{t.manage()}</Label>
                <div className="flex flex-align-items-center">
                    <Icon name={isLabelMapping ? 'tags' : 'folders'} className="mr-2" />
                    {selectedFoldersCount === totalFoldersCount ? (
                        <span>{t.totalCount(totalFoldersCount)}</span>
                    ) : (
                        <span>{t.partialCount(selectedFoldersCount)}</span>
                    )}
                    <Button
                        shape="outline"
                        className="ml2"
                        onClick={toggleFolderVisibility}
                        data-testid="CustomizeModal:toggleFolders"
                    >
                        {toggleActionCopy}
                    </Button>
                </div>
            </Row>
        </div>
    );
};

export default CustomizeMailImportModalCustomizeFoldersToggle;

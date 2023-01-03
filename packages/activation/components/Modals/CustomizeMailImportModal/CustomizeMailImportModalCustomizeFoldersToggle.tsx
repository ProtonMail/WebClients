import { EasyTrans } from '@proton/activation/helpers/easyTrans';
import { Button } from '@proton/atoms/Button';
import { Icon, Label, Row } from '@proton/components/components';

interface Props {
    isLabelMapping: boolean;
    organizeFolderVisible: boolean;
    selectedFoldersCount: number;
    toggleFolderVisility: () => void;
    totalFoldersCount: number;
}

const CustomizeMailImportModalCustomizeFoldersToggle = ({
    isLabelMapping,
    organizeFolderVisible,
    selectedFoldersCount,
    toggleFolderVisility: toggleFolders,
    totalFoldersCount,
}: Props) => {
    const t = EasyTrans.get(isLabelMapping);

    const toggleActionCopy = organizeFolderVisible ? t.hide() : t.show();

    return (
        <div className="mb1 border-bottom flex-align-items-center">
            <Row>
                <Label>{t.manage()}</Label>
                <div className="flex flex-align-items-center">
                    <Icon name={isLabelMapping ? 'tags' : 'folders'} className="mr0-5" />
                    {selectedFoldersCount === totalFoldersCount ? (
                        <span>{t.totalCount(totalFoldersCount)}</span>
                    ) : (
                        <span>{t.partialCount(selectedFoldersCount)}</span>
                    )}
                    <Button
                        shape="outline"
                        className="ml2"
                        onClick={toggleFolders}
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

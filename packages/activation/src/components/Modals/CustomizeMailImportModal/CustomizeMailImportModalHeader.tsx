import { EasyTrans } from '@proton/activation/src/helpers/easyTrans';

interface Props {
    isLabelMapping: boolean;
}

const CustomizeMailImportModalHeader = ({ isLabelMapping }: Props) => {
    return (
        <div className="mb-4" data-testid={`CustomizeModal:${isLabelMapping ? 'labelHeader' : 'folderHeader'}`}>
            {EasyTrans.get(isLabelMapping).infoHeader()}
        </div>
    );
};

export default CustomizeMailImportModalHeader;

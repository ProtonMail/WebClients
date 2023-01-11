import { EasyTrans } from '@proton/activation/helpers/easyTrans';

interface Props {
    isLabelMapping: boolean;
}

const CustomizeMailImportModalHeader = ({ isLabelMapping }: Props) => {
    return (
        <div className="mb1" data-testid={`CustomizeModal:${isLabelMapping ? 'labelHeader' : 'folderHeader'}`}>
            {EasyTrans.get(isLabelMapping).infoHeader()}
        </div>
    );
};

export default CustomizeMailImportModalHeader;

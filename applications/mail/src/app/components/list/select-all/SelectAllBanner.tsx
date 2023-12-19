import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import { Cancellable } from '@proton/components/hooks/useHandler';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

interface Props {
    labelID: string;
    onCheckAll: ((check: boolean) => void) & Cancellable;
}

const SelectAllBanner = ({ labelID, onCheckAll }: Props) => {
    const { selectAll, setSelectAll, getBannerText, getButtonText } = useSelectAll({ labelID });
    const buttonText = getButtonText();

    const handleClickButton = () => {
        const currentValue = selectAll;
        setSelectAll(!selectAll);

        if (currentValue) {
            onCheckAll(false);
        }
    };

    return (
        <div className="flex flex-item-noshrink text-center bg-norm">
            <div className="mx-auto m-2 px-2">
                <span className="m-0 mr-2 text-center text-ellipsis max-w-full inline-block align-middle">
                    {getBannerText()}
                </span>
                <InlineLinkButton
                    onClick={handleClickButton}
                    className="text-center text-ellipsis max-w-full align-middle"
                    color="norm"
                    title={buttonText}
                >
                    {buttonText}
                </InlineLinkButton>
            </div>
        </div>
    );
};

export default SelectAllBanner;

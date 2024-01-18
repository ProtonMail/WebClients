import { useRef } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import { Spotlight } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature } from '@proton/components/hooks';
import { Cancellable } from '@proton/components/hooks/useHandler';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

interface Props {
    labelID: string;
    onCheckAll: ((check: boolean) => void) & Cancellable;
}

const SelectAllBanner = ({ labelID, onCheckAll }: Props) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const { selectAll, setSelectAll, getBannerText, getButtonText } = useSelectAll({ labelID });
    const buttonText = getButtonText();
    const { show, onDisplayed } = useSpotlightOnFeature(FeatureCode.SpotlightSelectAll);

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
                <Spotlight
                    originalPlacement="right"
                    show={show}
                    onDisplayed={onDisplayed}
                    anchorRef={anchorRef}
                    size="large"
                    content={
                        <div className="flex flex-nowrap my-2">
                            <div className="shrink-0 mr-4">
                                <img src={spotlightImg} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
                            </div>
                            <div>
                                <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`Faster email management`}</p>
                                <p className="m-0">{c('Spotlight')
                                    .t`Now you can take action on all emails in a single folder in one go.`}</p>
                            </div>
                        </div>
                    }
                >
                    <InlineLinkButton
                        onClick={handleClickButton}
                        className="text-center text-ellipsis max-w-full align-middle"
                        color="norm"
                        title={buttonText}
                        ref={anchorRef}
                    >
                        {buttonText}
                    </InlineLinkButton>
                </Spotlight>
            </div>
        </div>
    );
};

export default SelectAllBanner;

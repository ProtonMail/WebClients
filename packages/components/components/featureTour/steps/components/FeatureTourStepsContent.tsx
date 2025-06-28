import type { ReactNode } from 'react';

import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import type { FeatureTourStepProps } from '../../interface';

interface FeatureTourStepsContentProps {
    title: ReactNode;
    bullets: FeatureTourStepProps['bullets'];
    children: ReactNode;
    illustration?: string;
    illustrationSize?: 'small' | 'medium' | 'full';
    mainCTA: ReactNode;
    extraCTA?: ReactNode;
}

const FeatureTourStepsContent = ({
    title,
    bullets,
    children,
    illustration,
    illustrationSize,
    mainCTA,
    extraCTA,
}: FeatureTourStepsContentProps) => {
    const illustrationWidth = illustrationSize === 'medium' ? '180' : undefined;
    const illustrationHeight = illustrationSize === 'full' ? undefined : '128';
    const illustrationClassName = illustrationSize === 'full' ? 'w-full' : 'mt-8';

    const hasTwoCTAs = !!mainCTA && !!extraCTA;

    const minContentHeight = (() => {
        if (!illustration) {
            return '23.5rem';
        }

        return hasTwoCTAs ? '8.75rem' : '11.5rem';
    })();

    return (
        <ModalContent unstyled>
            <div
                className={illustration ? 'relative flex justify-center items-center h-custom bg-lowered' : undefined}
                style={illustration ? { '--h-custom': '12rem' } : undefined}
            >
                <ModalHeaderCloseButton
                    buttonProps={{
                        className: 'absolute right-0 top-0 mt-3 mr-3',
                    }}
                    iconProps={{
                        style: illustrationSize === 'full' ? { fill: 'white' } : undefined,
                    }}
                />
                {illustration && (
                    <img
                        src={illustration}
                        alt=""
                        // eslint-disable-next-line no-nested-ternary
                        width={illustrationWidth}
                        height={illustrationHeight}
                        className={illustrationClassName}
                    />
                )}
            </div>
            <div className="p-8">
                <div
                    className={clsx(
                        'min-h-custom w-full flex flex-column flex-nowrap grow-0 justify-center items-center'
                    )}
                    style={{ '--min-h-custom': minContentHeight }}
                >
                    <h1 className="text-lg text-bold text-center mb-2">{title}</h1>
                    <div className="text-center color-weak w-full">{children}</div>
                </div>

                <div className="flex flex-column gap-2 mt-6 mb-2">
                    {mainCTA}
                    {extraCTA}
                </div>

                {bullets}
            </div>
        </ModalContent>
    );
};

export default FeatureTourStepsContent;

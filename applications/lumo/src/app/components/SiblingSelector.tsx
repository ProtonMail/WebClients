import { c } from 'ttag';

import type { SiblingInfo } from '../types';
import LumoButton from './Buttons/LumoButton';

type SiblingSelectorProps = { siblingInfo: SiblingInfo };

const SiblingSelector = ({ siblingInfo }: SiblingSelectorProps) => {
    const { count, idx, onNext, onPrev } = siblingInfo;
    return (
        <>
            {count > 1 && (
                <div
                    className="flex flex-row flex-nowrap gap-px px-1 items-center p-0.5"
                    style={{ inlineSize: 'max-content' }}
                >
                    <LumoButton
                        onClick={onPrev}
                        iconName="chevron-left"
                        title={c('collider_2025:Action').t`Previous message`}
                        tooltipPlacement="top"
                        disabled={idx <= 0}
                    />
                    <div className="flex flex-row flex-nowrap items-center">
                        {idx + 1} / {count}
                    </div>

                    <LumoButton
                        onClick={onNext}
                        iconName="chevron-right"
                        title={c('collider_2025:Action').t`Next message`}
                        tooltipPlacement="top"
                        disabled={idx >= count - 1}
                    />
                </div>
            )}
        </>
    );
};

export default SiblingSelector;

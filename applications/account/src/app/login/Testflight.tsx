import { c } from 'ttag';

import { Card, type CardProps } from '@proton/atoms';

import testflight from './testflight.png';

interface Props extends Omit<CardProps<'div'>, 'rounded' | 'bordered' | 'background'> {}

const Testflight = (props: Props) => {
    const destination = 'Apple Testflight';
    return (
        <Card rounded {...props}>
            <div className="flex flex-nowrap gap-3">
                <img src={testflight} height={40} width={40} alt="" className="shrink-0 rounded" />
                <span>
                    {
                        // translator: Full sentence: You will be redirected to Apple Testflight after signing in.
                        c('Info').t`You will be redirected to ${destination} after signing in.`
                    }
                </span>
            </div>
        </Card>
    );
};

export default Testflight;

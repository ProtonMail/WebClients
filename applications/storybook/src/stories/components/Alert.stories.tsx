import { Alert } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Alert.mdx';

export default {
    component: Alert,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <Alert>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati
        enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?
    </Alert>
);

export const Types = () => (
    <>
        <Alert className="mb1">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
            obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis
            quos?
        </Alert>
        <Alert className="mb1" type="error">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo corporis ea nobis nesciunt sed sit architecto
            atque. Vero, corrupti non nobis, officia blanditiis magnam ex sapiente et expedita, animi tenetur!
        </Alert>
        <Alert className="mb1" type="warning">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores tempora ea eos corporis facilis facere,
            nemo sunt. Eos, blanditiis laboriosam expedita voluptatem eaque vero esse, minima temporibus, ab ad
            nesciunt?
        </Alert>
        <Alert className="mb1" type="success">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam
            laborum aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
            voluptatibus?
        </Alert>
    </>
);

export const LearnMoreLink = () => (
    <Alert learnMore="https://www.proton.me">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Officiis, veritatis. Natus odit minus, maxime esse
        illo perferendis expedita, officia libero ab qui architecto nostrum dignissimos hic aspernatur, ipsum unde
        voluptatibus?
    </Alert>
);

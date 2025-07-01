import { Alert } from '@proton/components';

import mdx from './Alert.mdx';

export default {
    component: Alert,
    title: 'Components/Alert',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <Alert>
        Lorem Ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus obcaecati
        enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis quos?
    </Alert>
);

export const Types = () => (
    <>
        <Alert className="mb-4">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium unde, blanditiis rem accusamus
            obcaecati enim amet, voluptatibus nemo facilis illum aut itaque in? Deleniti iure amet qui vero, blanditiis
            quos?
        </Alert>
        <Alert className="mb-4" type="error">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nemo corporis ea nobis nesciunt sed sit architecto
            atque. Vero, corrupti non nobis, officia blanditiis magnam ex sapiente et expedita, animi tenetur!
        </Alert>
        <Alert className="mb-4" type="warning">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Maiores tempora ea eos corporis facilis facere,
            nemo sunt. Eos, blanditiis laboriosam expedita voluptatem eaque vero esse, minima temporibus, ab ad
            nesciunt?
        </Alert>
        <Alert className="mb-4" type="success">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sit doloribus nobis eos iusto. Ducimus numquam
            laborum aliquid culpa! Dolor voluptatem modi inventore error, qui repudiandae consequatur autem vitae illum
            voluptatibus?
        </Alert>
    </>
);

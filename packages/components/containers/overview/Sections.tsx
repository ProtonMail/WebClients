import type { SubSectionConfig } from '../layout/interface';
import LinkItem from './LinkItem';

interface Props {
    to: string;
    text: string;
    subsections?: SubSectionConfig[];
    available?: boolean;
}
const Sections = ({ to, subsections = [], text, available }: Props) => {
    return (
        <ul className="unstyled mt-2">
            {subsections.length ? (
                subsections
                    .filter(({ hide }) => !hide)
                    .map(({ text, id, available }) => {
                        return (
                            <li key={id} className="my-2">
                                <LinkItem to={`${to}#${id}`} text={text} available={available} />
                            </li>
                        );
                    })
            ) : (
                <li>
                    <LinkItem to={to} text={text} available={available} />
                </li>
            )}
        </ul>
    );
};

export default Sections;

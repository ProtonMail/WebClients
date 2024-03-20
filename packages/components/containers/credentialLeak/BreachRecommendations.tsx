import { c } from 'ttag';

interface Props {
    actions:
        | null
        | {
              code: string;
              name: string;
              desc: string;
          }[];
}

// html removed from BE payloads until parsing and sanitizing is added
// const parseHTML = (htmlString: string) => {
//     const regex = /<a href="(.*?)">(.*?)<\/a>/g;
//     let match;
//     const parts = [];
//     let lastIndex = 0;

//     while ((match = regex.exec(htmlString)) !== null) {
//         const [fullMatch, href, text] = match;
//         const plainText = htmlString.substring(lastIndex, match.index);
//         parts.push(plainText);
//         parts.push(
//             <a key={parts.length} href={href} target="_blank" rel="noopener noreferrer">
//                 {text}
//             </a>
//         );
//         lastIndex = match.index + fullMatch.length;
//     }
//     parts.push(htmlString.substring(lastIndex));

//     return parts;
// };

const Action = (props: any) => {
    const { action, description } = props;

    return (
        <div
            className="flex flex-column flex-nowrap gap-1 rounded py-3 px-4 border border-weak h-custom"
            style={{ '--min-h-custom': '3.625rem' }}
        >
            <span className="block text-semibold">{action}</span>
            <span className="block m-0 text-sm color-weak">{description}</span>
        </div>
    );
};

const BreachRecommendations = ({ actions }: Props) => {
    if (!actions) {
        return null;
    }

    return (
        <>
            <h4 className="text-semibold text-rg">{c('Title').t`Recommended actions`}</h4>
            {actions.map(({ name, desc }: any) => {
                return <Action key={`${name}`} action={name} description={desc} />;
            })}
        </>
    );
};

export default BreachRecommendations;

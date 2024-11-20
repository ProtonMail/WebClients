export type PostSubscriptionModalName = 'mail-short-domain';

export interface PostSubscriptionModalComponentProps {
    onClose: () => void;
}

export type PostSubscriptionModalConfig = {
    component: (props: PostSubscriptionModalComponentProps) => JSX.Element;
};

/**
 * Higher-order component (HOC) to wrap a component with a custom hook that injects props.
 *
 * WHY:
 * - Some components depend on logic or derived state provided by a custom hook.
 * - This HOC pattern allows us to move hook logic *outside* of the component and keep the
 *   UI component focused purely on presentation.
 * - It enables reuse and testing of both the hook and the component in isolation.
 * - It also simplifies usage for consumers, they just pass `HookProps` and get a fully
 *   functional component without worrying about wiring up the hook.
 *
 * HOW:
 * - `useHook` is a function hook that takes `HookProps` (input props) and returns `InjectedProps`
 *   (props that the inner `Component` needs).
 * - The HOC returns a new component that:
 *    1. Accepts `HookProps` as its props.
 *    2. Calls the `useHook` with those props to get derived/injected props.
 *    3. Renders the target `Component` with those injected props.
 *
 * Usage:
 * const SmartComponent = withHoc(useMyHook, MyComponent);
 * <SmartComponent someHookInput={...} /> // Only provides HookProps
 */
export function withHoc<HookProps extends {}, InjectedProps extends {}>(
    useHook: (props: HookProps) => InjectedProps,
    Component: React.ComponentType<InjectedProps>
): React.FC<HookProps> {
    return function EnhancedComponent(props: HookProps) {
        const injectedProps = useHook(props);
        return <Component {...injectedProps} />;
    };
}

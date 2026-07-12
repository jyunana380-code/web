declare module 'react' {
  export type FormEvent<T = Element> = Event & { currentTarget: T };
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((current: T) => T)) => void];
  export const StrictMode: (props: { children?: unknown }) => unknown;
  const React: { StrictMode: typeof StrictMode };
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element): { render(children: unknown): void };
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare module '*.css';

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

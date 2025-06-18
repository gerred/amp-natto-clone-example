import type { FlowStore } from '../types';
export declare const useFlowStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<FlowStore>, "setState" | "devtools"> & {
    setState(partial: FlowStore | Partial<FlowStore> | ((state: FlowStore) => FlowStore | Partial<FlowStore>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: FlowStore | ((state: FlowStore) => FlowStore), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}>;

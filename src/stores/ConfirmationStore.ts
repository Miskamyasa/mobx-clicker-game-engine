import {makeAutoObservable} from "mobx"

import type {RootStore} from "./RootStore"


export interface ConfirmationRequest {
    id: number;
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string; // defaults to "Cancel"
    resolver: (confirmed: boolean) => void;
}

export interface ConfirmationOptions {
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string;
}

export class ConfirmationStore {
    constructor(_root: RootStore) {
        makeAutoObservable(this)
    }

    currentConfirmation: ConfirmationRequest | null = null
    private nextId = 1

    async ask(options: ConfirmationOptions): Promise<boolean> {
        // If there's already a confirmation showing, reject the previous one and show the new one
        if (this.currentConfirmation !== null) {
            this.currentConfirmation.resolver(false)
        }

        return new Promise<boolean>((resolve) => {
            this.currentConfirmation = {
                id: this.nextId++,
                title: options.title,
                description: options.description,
                confirmText: options.confirmText,
                cancelText: options.cancelText ?? "Cancel",
                resolver: resolve
            }
        })
    }

    resolve(confirmed: boolean): void {
        if (this.currentConfirmation === null) {
            throw new Error("ConfirmationStore.resolve() called but there is no current confirmation")
        }

        const current = this.currentConfirmation
        this.currentConfirmation = null
        current.resolver(confirmed)
    }

    cancel(): void {
        this.resolve(false)
    }

    confirmCurrent(): void {
        this.resolve(true)
    }
}

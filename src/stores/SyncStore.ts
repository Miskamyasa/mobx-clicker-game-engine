import {makeAutoObservable} from "mobx"

import type {RootStore} from "./RootStore"
import {gameSaveSchema, type GameSaveSnapshot, STORES_TO_SYNC} from "./shared"


const SAVE_KEY = "ocean_explorer_save"

type StoreName = typeof STORES_TO_SYNC[number];

export class SyncStore {
    constructor(private root: RootStore) {
        makeAutoObservable(this)
    }

    state: "idle" | "saving" | "loading" | "error" = "idle"

    lastSave: number = 0

    dirty: Set<StoreName> = new Set()

    get isDirty(): boolean {
        return this.dirty.size > 0
    }

    markDirty = (store: StoreName) => {
        this.dirty.add(store)
    }

    clearDirty = () => {
        this.dirty.clear()
    }

    getSnapshot(timestamp: number): GameSaveSnapshot {
        return {
            version: this.root.config.gameVersion,
            timestamp,
            resources: this.root.resources.getSnapshot(),
            workers: this.root.workers.getSnapshot(),
            operations: this.root.operations.getSnapshot(),
            codex: this.root.codex.getSnapshot(),
            level: this.root.level.getSnapshot(),
            upgrades: this.root.upgrades.getSnapshot(),
            achievements: this.root.achievements.getSnapshot(),
            prestige: this.root.prestige.getSnapshot(),
        }
    }

    loadSnapshot(snapshot: GameSaveSnapshot) {
        if (this.isDirty) {
            throw new Error("Cannot load snapshot while store state is dirty")
        }
        for (const store of STORES_TO_SYNC) {
            this.root[store].loadSnapshot(snapshot)
        }
    }

    * save() {
        if (!this.isDirty) {
            return
        }
        if (this.state !== "idle") {
            throw new Error("Cannot save while state is not idle")
        }
        const now = Date.now()
        const shouldBeSaved = now - this.lastSave > this.root.config.localSaveInterval
        if (!shouldBeSaved) {
            return
        }
        this.state = "saving"
        try {
            const snapshot = this.getSnapshot(now)
            yield new Promise(resolve => {
                localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
                resolve(true)
            })
            this.clearDirty()
            this.lastSave = now
        } finally {
            this.state = "idle"
        }
    }

    * load() {
        if (this.state !== "idle") {
            throw new Error("Cannot load while state is not idle")
        }
        this.state = "loading"
        try {
            const data: string | null = yield new Promise(resolve => {
                resolve(localStorage.getItem(SAVE_KEY))
            })
            if (data) {
                const snapshot = gameSaveSchema.parse(JSON.parse(data))
                this.loadSnapshot(snapshot)
                return snapshot.timestamp
            }
        }
        catch (e) {
            console.error("Failed to load save data:", e)
        }
        finally {
            this.state = "idle"
        }
    }

    reset() {
        if (this.state !== "idle") {
            throw new Error("Cannot reset while state is not idle")
        }
        for (const store of STORES_TO_SYNC) {
            this.root[store].reset()
        }
        localStorage.removeItem(SAVE_KEY)
    }
}

import {computed, makeObservable} from "mobx"

import {AchievementsStore} from "./AchievementsStore"
import {CodexStore} from "./CodexStore"
import {ConfigStore} from "./ConfigStore"
import {ConfirmationStore} from "./ConfirmationStore"
import {EngineDataSource} from "./EngineDataSource"
import {GameStore} from "./GameStore"
import {LevelStore} from "./LevelStore"
import {OperationsStore} from "./OperationsStore"
import {PrestigeStore} from "./PrestigeStore"
import {ResourcesStore} from "./ResourcesStore"
import type {RootStoreOptions} from "./RootStoreOptions"
import {STORES_TO_SYNC} from "./shared"
import {SyncStore} from "./SyncStore"
import {ToastStore} from "./ToastStore"
import {UpgradesStore} from "./UpgradesStore"
import {WorkersStore} from "./WorkersStore"


export class RootStore {
    constructor(options: RootStoreOptions) {
        this.options = options
        this.dataSource = new EngineDataSource(options.dataUrls)

        this.config = new ConfigStore(this)
        this.sync = new SyncStore(this)
        this.toast = new ToastStore(this)
        this.confirmation = new ConfirmationStore(this)
        this.resources = new ResourcesStore(this)
        this.workers = new WorkersStore(this)
        this.operations = new OperationsStore(this)
        this.codex = new CodexStore(this)
        this.level = new LevelStore(this)
        this.upgrades = new UpgradesStore(this)
        this.achievements = new AchievementsStore(this)
        this.prestige = new PrestigeStore(this)
        this.game = new GameStore(this)

        makeObservable(this, {
            dataReady: computed,
        })
    }

    readonly options: RootStoreOptions
    readonly dataSource: EngineDataSource

    readonly config: ConfigStore
    readonly sync: SyncStore
    readonly toast: ToastStore
    readonly confirmation: ConfirmationStore
    readonly resources: ResourcesStore
    readonly workers: WorkersStore
    readonly operations: OperationsStore
    readonly codex: CodexStore
    readonly level: LevelStore
    readonly upgrades: UpgradesStore
    readonly achievements: AchievementsStore
    readonly prestige: PrestigeStore
    readonly game: GameStore

    get dataReady(): boolean {
        return STORES_TO_SYNC.every(store => {
            return this[store].state === "ready"
        })
    };
}

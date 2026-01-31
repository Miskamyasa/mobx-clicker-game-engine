import type {Achievement} from "./AchievementsStore"
import type {Article} from "./CodexStore"
import type {Levels} from "./LevelStore"
import type {Operations} from "./OperationsStore"
import type {PrestigeUpgrades} from "./PrestigeStore"
import type {RootStoreOptions} from "./RootStoreOptions"
import type {Upgrades} from "./UpgradesStore"
import type {Workers} from "./WorkersStore"


type DataUrls = RootStoreOptions["dataUrls"]

type Fetcher = typeof fetch

export class EngineDataSource {
    private fetcher: Fetcher

    constructor(private dataUrls: DataUrls, fetcher?: Fetcher) {
        const resolvedFetch = fetcher ?? globalThis.fetch
        if (!resolvedFetch) {
            throw new Error("EngineDataSource requires a fetch implementation.")
        }
        this.fetcher = resolvedFetch.bind(globalThis)
    }

    fetchWorkers(): Promise<Workers> {
        return this.fetchJson("workers")
    }

    fetchLevels(): Promise<Levels> {
        return this.fetchJson("levels")
    }

    fetchOperations(): Promise<Operations> {
        return this.fetchJson("operations")
    }

    fetchUpgrades(): Promise<Upgrades> {
        return this.fetchJson("upgrades")
    }

    fetchAchievements(): Promise<Achievement[]> {
        return this.fetchJson("achievements")
    }

    fetchArticles(): Promise<Article[]> {
        return this.fetchJson("articles")
    }

    fetchPrestigeUpgrades(): Promise<PrestigeUpgrades> {
        return this.fetchJson("prestigeUpgrades")
    }

    private getUrl(key: keyof DataUrls): string {
        const url = this.dataUrls[key]
        if (!url) {
            throw new Error(`Missing data URL for ${key}.`)
        }
        return url
    }

    private async fetchJson<T>(key: keyof DataUrls): Promise<T> {
        const url = this.getUrl(key)
        const response = await this.fetcher(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${key} from ${url}: ${response.status} ${response.statusText}`)
        }
        return response.json() as Promise<T>
    }
}

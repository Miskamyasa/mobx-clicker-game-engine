import {RootStore} from "./stores/RootStore"
import type {RootStoreOptions} from "./stores/RootStoreOptions"


export const createEngine = (options: RootStoreOptions) => {
    return new RootStore(options)
}

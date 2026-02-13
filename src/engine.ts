import type { RootStoreOptions } from "./stores/RootStoreOptions"
import { RootStore } from "./stores/RootStore"

export function createEngine(options: RootStoreOptions) {
  return new RootStore(options)
}

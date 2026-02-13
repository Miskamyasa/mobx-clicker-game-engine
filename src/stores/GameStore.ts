import type { RootStore } from "./RootStore"

import { flowResult, makeAutoObservable } from "mobx"

export class GameStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
  }

  running: boolean = false

  start(): void {
    if (this.running) {
      return
    }
    this.running = true
    this.loop()
  }

  stop(): void {
    this.running = false
    void flowResult(this.root.sync.save())
  }

  reset(): void {
    this.stop()
    this.root.sync.reset()
  }

  private loop(): void {
    if (!this.running) {
      return
    }

    const now = Date.now()

    this.root.resources.round()
    this.root.level.round()
    this.root.prestige.round()
    this.root.achievements.round()

    if (now - this.root.sync.lastSave >= this.root.config.localSaveInterval) {
      void flowResult(this.root.sync.save())
    }

    setTimeout(() => this.loop(), this.root.config.gameRoundInterval)
  }

  get energyCost(): number {
    return Math.ceil(
      this.root.config.baseEnergyCost
      * this.root.level.energyCostMultiplier,
    )
  }

  get outputGain(): number {
    return Math.floor(
      this.root.config.baseOutputGain
      * this.root.level.outputGain
      * this.root.upgrades.multipliers.get("outputGain")!
      * this.root.achievements.multipliers.get("outputGain")!
      * this.root.prestige.multipliers.get("outputGain")!,
    )
  }

  click() {
    if (this.root.resources.spendResource("energy", this.energyCost)) {
      this.root.resources.addResource("output", this.outputGain)
    }
  }
}

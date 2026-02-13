import type { RootStore } from "./RootStore"

import type { Rarity } from "./shared"
import { makeAutoObservable } from "mobx"

export class ConfigStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
  }

  gameVersion = "0.0.0"

  localSaveInterval = 5000 // 5 seconds
  gameRoundInterval = 1000 // 1 second

  maxOfflineTime = 8 * 60 * 60 * 1000 // 8 hours max
  offlineMultiplier = 0.5 // 50% efficiency

  // energy production
  baseEnergyProduction = 1 // Base workers energy production
  // energyDiminishingReturnsExponent = 0.9; // Diminishing returns exponent for energy production

  // output production
  baseOutputProduction = 1 // Base workers output production
  // outputDiminishingReturnsExponent = 0.9; // Diminishing returns exponent for output production

  // reputation conversion
  moneyPerReputation = 0.3 // Base grants per reputation point
  // reputationDiminishingReturnsExponent = 0.9; // Diminishing returns exponent for reputation conversion

  // click cost and gain
  baseEnergyCost = 5
  baseOutputGain = 10

  operationScaleFactor: Record<Rarity, number> = { // Scale factors for discovery costs based on rarity
    common: 1.2,
    uncommon: 1.4,
    rare: 1.6,
    epic: 1.8,
    legendary: 2.0,
  }

  toastTimeout = 4000

  levelUpConfirmText = "Let's do it!"

  prestige = {
    baseOperationsCompleted: 100,
    softCapThreshold: 5,
    softCapMultiplier: 0.1,
  }
}

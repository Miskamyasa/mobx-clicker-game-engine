import type { Achievement } from "./AchievementsStore"

import type { Article } from "./CodexStore"
import type { RootStore } from "./RootStore"
import { makeAutoObservable } from "mobx"

export interface ToastMessage {
  id: number
  type: "achievement" | "article"
  title: string
  message?: string
  duration?: number // Auto-dismiss time in ms (default: 4000)
  icon?: string
  data?: Record<string, unknown> // Additional context data
}

export class ToastStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
  }

  toasts = new Map<number, ToastMessage>()
  private head = 0 // Track the last used ID for efficient ID generation
  private timeouts = new Map<number, ReturnType<typeof setTimeout>>()

  showToast(options: Omit<ToastMessage, "id">) {
    const id = ++this.head
    const toast: ToastMessage = {
      id,
      duration: this.root.config.toastTimeout, // Default 4 seconds
      ...options,
    }

    this.toasts.set(id, toast)
    this.timeouts.set(id, setTimeout(() => {
      this.dismissToast(id)
    }, toast.duration))
  }

  dismissToast(id: number): void {
    if (this.toasts.has(id)) {
      this.toasts.delete(id)
    }

    // Clear timeout if exists
    const timeout = this.timeouts.get(id)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(id)
    }
  }

  // Convenience methods for common toast types
  showAchievementToast(achievement: Achievement): void {
    this.showToast({
      type: "achievement",
      title: "Achievement Unlocked!",
      message: achievement.name,
      icon: achievement.icon,
      duration: 5000, // Achievements show longer
      data: { achievementId: achievement.id },
    })
  }

  showArticleToast(article: Article): void {
    this.showToast({
      type: "article",
      title: "New Discovery!",
      message: article.title,
      icon: "📖",
      duration: 4000,
      data: { articleId: article.id },
    })
  }
}

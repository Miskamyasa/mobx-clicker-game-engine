import type { RootStore } from "./RootStore"
import type { CodexSnapshot } from "./shared"

import { makeAutoObservable, observable } from "mobx"
import { z } from "zod"
import { codexSnapshotSchema } from "./shared"

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
}).readonly()

export type Article = z.infer<typeof articleSchema>

export class CodexStore {
  constructor(private root: RootStore) {
    makeAutoObservable(this)
    this.loadArticles()
  }

  state: "pending" | "ready" | "error" = "pending"

  articles: Article[] = []

  get mappedArticles(): Map<Article["id"], Article> {
    return new Map(this.articles.map(a => [a.id, a]))
  }

  * loadArticles() {
    try {
      const dataSource = this.root.dataSource
      if (!dataSource) {
        throw new Error("RootStore dataSource is required to load articles.")
      }
      const response: unknown = yield dataSource.fetchArticles()
      this.articles = z.array(articleSchema).parse(response)
      this.state = "ready"
    }
    catch (e) {
      console.error("Failed to load publications", e)
      this.state = "error"
    }
  }

  unlockedArticles = observable.set<Article["id"]>([])

  unlockArticle(articleId: Article["id"]) {
    const article = this.mappedArticles.get(articleId)
    if (!article) {
      throw new Error(`Article not found: ${articleId}`)
    }
    if (this.unlockedArticles.has(article.id)) {
      return
    }
    this.unlockedArticles.add(article.id)
    this.root.achievements.addArticlesOpened()
    this.root.sync.markDirty("codex")
    this.root.toast.showArticleToast(article)
  }

  getSnapshot(): CodexSnapshot {
    return {
      unlockedArticles: Array.from(this.unlockedArticles),
    }
  }

  loadSnapshot(snapshot: { codex: CodexSnapshot }) {
    const validated = codexSnapshotSchema.parse(snapshot.codex)
    this.unlockedArticles = observable.set(validated.unlockedArticles)
  }

  reset() {
    this.unlockedArticles.clear()
  }
}

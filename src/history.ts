import { getTeam } from './util'
import { render } from './historyUI'

const selectors = {
  id: '.post-header__id',
  name: '.post-title__name',
}

export type Post = {
  id: number
  name: string
  category: string
  tags: string[]
  wip: boolean
  star: boolean
  created_by: {
    screen_name: string
    icon: string
  }
}

export type HistoryStore = {
  posts: Record<number, Post>
  historyIds: number[]
}

const exist = (selector: string) => Boolean(document.querySelector(selector))
const selectAll = (selector: string) =>
  Array.from(document.querySelectorAll(selector))
const select = (selector: string) => document.querySelector(selector)

export const historyStorage = {
  get: (teamName: string, cb: (store: HistoryStore) => void) => {
    chrome.storage.sync.get(
      [teamName],
      (result: { [team: string]: HistoryStore }) => {
        cb({ posts: {}, historyIds: [], ...result[teamName] })
      },
    )
  },
  set: (teamName: string, store: HistoryStore, cb: () => void) => {
    chrome.storage.sync.set(
      {
        [teamName]: store,
      },
      () => {
        cb()
      },
    )
  },
}

const pushHistory = (teamName: string, post: Post) => {
  historyStorage.get(teamName, (result) => {
    const newStore: HistoryStore = {
      posts: {
        [post.id]: post,
        ...result.posts,
      },
      historyIds: [
        post.id,
        ...result.historyIds.filter((id) => id !== post.id),
      ], // new Set
    }

    // 件数より多かったら削除する何かの処理
    console.log(result)

    historyStorage.set(teamName, newStore, () => {
      console.log('saved:', newStore)
    })
  })
}

const init = () => {
  const teamName = getTeam(document.URL)

  document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.keyCode === 75) render(teamName) // cmd + K
  })

  if (document.URL.search(/esa.io\/posts\/\d+$/) > -1) {
    const author = select('.post-author')
    let post: Post = {
      id: Number(select(selectors.id).textContent.replace('#', '')),
      name: select(selectors.name).textContent,
      category: selectAll('.category-path__link')
        .map((node) => node.textContent)
        .join('/'),
      tags: selectAll('.post-title__tag').map((node) =>
        node.textContent.trim(),
      ),
      wip: exist('.is-wip.post-title'),
      star: exist('.is-starred.js-star-button'),
      created_by: {
        screen_name: author.querySelector('.post-author__user > a').textContent,
        icon: (author.querySelector('.thumbnail__image') as HTMLImageElement)
          .src,
      },
    }
    console.log(post)

    pushHistory(teamName, post)
  }
}

export default { init }

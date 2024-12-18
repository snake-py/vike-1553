export { initClientRouter }

import { assert } from './utils.js'
import { getRenderCount, renderPageClientSide } from './renderPageClientSide.js'
import { initOnPopState } from './initOnPopState.js'
import { initOnLinkClick } from './initOnLinkClick.js'
import { setupNativeScrollRestoration } from './scrollRestoration.js'
import { autoSaveScrollPosition } from './setScrollPosition.js'
import { initLinkPrefetchHandlers } from './prefetch.js'

async function initClientRouter() {
  // Init navigation history and scroll restoration
  initHistoryAndScroll()

  // Render/hydrate
  const renderFirstPagePromise = renderFirstPage()

  // Intercept <a> clicks
  initOnLinkClick()

  // Add <a> prefetch handlers
  initLinkPrefetchHandlers()

  // Preserve stack track
  await renderFirstPagePromise
}

async function renderFirstPage() {
  assert(getRenderCount() === 0)
  await renderPageClientSide({
    scrollTarget: { preserveScroll: true },
    isBackwardNavigation: null,
    isClientSideNavigation: false
  })
}

function initHistoryAndScroll() {
  setupNativeScrollRestoration()
  autoSaveScrollPosition()
  // Handle back-/forward navigation
  initOnPopState()
}

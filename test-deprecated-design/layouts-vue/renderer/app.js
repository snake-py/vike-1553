import { createSSRApp, defineComponent, h, markRaw, reactive, ref } from 'vue'
import LayoutDefault from './LayoutDefault.vue'
import { setPageContext } from './usePageContext'

export { createApp }

function createApp(pageContext) {
  const { Page } = pageContext

  const pageRef = ref(markRaw(Page))
  const pagePropsRef = ref(markRaw(pageContext.pageProps || {}))
  const layoutRef = ref(markRaw(pageContext.exports.Layout || LayoutDefault))

  const PageWithWrapper = defineComponent({
    render() {
      return h(layoutRef.value, {}, { default: () => h(pageRef.value, pagePropsRef.value) })
    }
  })

  const app = createSSRApp(PageWithWrapper)

  // We use `app.changePage()` to do Client Routing, see `_default.page.client.js`
  app.changePage = (pageContext) => {
    Object.assign(pageContextReactive, pageContext)
    pageRef.value = markRaw(pageContext.Page)
    pagePropsRef.value = markRaw(pageContext.pageProps || {})
    layoutRef.value = markRaw(pageContext.exports.Layout || LayoutDefault)
  }

  // When doing Client Routing, we mutate pageContext (see usage of `app.changePage()` in `_default.page.client.js`).
  // We therefore use a reactive pageContext.
  const pageContextReactive = reactive(pageContext)

  // Make `pageContext` accessible from any Vue component
  setPageContext(app, pageContextReactive)

  return app
}

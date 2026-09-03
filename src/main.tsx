import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { library, config } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
// Icons: @fortawesome/react-fontawesome (via the shared <Icon> component),
// NOT a CSS webfont and NOT Font Awesome's DOM-mutating "SVG+JS" auto-replace
// script. Both of those broke on this app's Power Platform host once pushed:
// - CSS/webfont build: @font-face binary font requests get blocked/corrupted
//   by the host's CSP (font-src 'self'), whether CDN-hosted or self-hosted.
// - SVG+JS auto-replace build: it mutates the DOM directly (inserting <svg>
//   siblings next to every <i>), which crashed the app with `NotFoundError:
//   Failed to execute 'removeChild' on 'Node'` the moment a dynamic list
//   (e.g. the proof-files drawer) re-rendered a subtree it had touched.
// react-fontawesome renders icons as plain React elements — fully owned by
// React's own reconciler, no separate font request, no DOM-mutation conflict.
// styles.css here is FA's small SVG sizing/animation stylesheet, not a
// webfont — zero @font-face rules, so it isn't subject to the same CSP issue.
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
library.add(fas, far, fab)
// Outfit/Inter/JetBrains Mono are still attempted self-hosted below — same
// font-src restriction likely blocks these too, but every font-family
// declaration in theme.css already lists a system-font fallback
// (`system-ui`/`sans-serif`/`monospace`), so a blocked custom font just
// degrades to the system font instead of rendering broken, unlike icons
// which have no such fallback.
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './styles/theme.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

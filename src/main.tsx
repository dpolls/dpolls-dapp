import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, } from 'react-router-dom'
import neroConfig from '../nerowallet.config'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'
import { Switch } from 'antd';
import { ThemeProvider } from '@/components/theme-provider'
import { AntThemeProvider } from '@/components/ant-theme-provider'
import LandingPage from '@/pages/landing/page'
import PollAdminPage from '@/pages/admin/page'
import CreatePollPage from '@/pages/landing/polls/new/page'
import LivePollsPage from '@/pages/landing/polls/live/page'
import LegacyClaimsPage from '@/pages/claims/legacy/page'
import LegacyDistributePage from '@/pages/claims/legacy/distribute'
import { FloatingChatButton } from '@/components/ui_v3/floating-chat-button'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem
    disableTransitionOnChange
  >
    <AntThemeProvider>
      <BrowserRouter>
        <SocialWallet config={neroConfig} mode='sidebar'>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin" element={<PollAdminPage />} />
            <Route path="/polls/new" element={<CreatePollPage />} />
            <Route path="/polls/live" element={<LivePollsPage />} />
            <Route path="/claims_legacy" element={<LegacyClaimsPage />} />
            <Route path="/claims_legacy_distribute" element={<LegacyDistributePage />} />
          </Routes>
          <FloatingChatButton />
        </SocialWallet>
      </BrowserRouter>
    </AntThemeProvider>
  </ThemeProvider>,
)

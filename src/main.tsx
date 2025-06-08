import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, } from 'react-router-dom'
import neroConfig from '../nerowallet.config'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'
import { ConfigProvider, Switch } from 'antd';
import LandingPage from '@/pages/landing/page'
import PollAdminPage from '@/pages/admin/page'
import CreatePollPage from '@/pages/landing/polls/new/page'
import LivePollsPage from '@/pages/landing/polls/live/page'


ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#000"
      },
    }}
  >
    <BrowserRouter>
      <SocialWallet config={neroConfig} mode='sidebar'>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<PollAdminPage />} />
          <Route path="/polls/new" element={<CreatePollPage />} />
          <Route path="/polls/live" element={<LivePollsPage />} />
        </Routes>
      </SocialWallet>
    </BrowserRouter>
  </ConfigProvider>,
)

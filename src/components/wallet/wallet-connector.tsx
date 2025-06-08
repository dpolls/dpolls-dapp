"use client"

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from 'antd';

interface WalletConnectorProps {
  isWalletConnected: boolean
  setIsWalletConnected: (isWalletConnected: boolean) => void
}

export function WalletConnector({ isWalletConnected, setIsWalletConnected }: WalletConnectorProps) {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected = Boolean(
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated'),
        )

        if (!setIsWalletConnected) {
          return null;
        }

        if (isWalletConnected !== connected) {
          setIsWalletConnected(connected)
        }

        if (!ready) return null
        if (chain?.unsupported) {
          return (
            <Button
              onClick={openConnectModal}
            >
              Connect Wallet
            </Button>
          )
        }

        if (connected) {
          return (
            <Button
              onClick={openConnectModal}
            >
              Connect Wallet
            </Button>
          );
        }
        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
            >
              Connect Wallet
            </Button>
          )
        }
      }}
    </RainbowConnectButton.Custom>
  );
}
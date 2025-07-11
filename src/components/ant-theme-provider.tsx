"use client"

import { ConfigProvider, theme } from 'antd';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface AntThemeProviderProps {
  children: React.ReactNode;
}

export function AntThemeProvider({ children }: AntThemeProviderProps) {
  const { theme: currentTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#000"
          },
        }}
      >
        {children}
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#000"
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
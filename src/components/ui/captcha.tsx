import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
  onVerify: (token: string | null) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
  size?: 'compact' | 'normal' | 'invisible';
  theme?: 'light' | 'dark';
}

export interface CaptchaRef {
  reset: () => void;
  execute: () => Promise<string | null>;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ onVerify, onExpire, onError, className = '', size = 'normal', theme = 'light' }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      execute: async () => {
        if (size === 'invisible') {
          return await recaptchaRef.current?.executeAsync() || null;
        }
        return recaptchaRef.current?.getValue() || null;
      }
    }));

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
      console.error('VITE_RECAPTCHA_SITE_KEY is not set in environment variables');
      return null;
    }

    return (
      <div className={`captcha-container ${className}`}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onVerify}
          onExpired={onExpire}
          onError={onError}
          size={size}
          theme={theme}
        />
      </div>
    );
  }
);

Captcha.displayName = 'Captcha';
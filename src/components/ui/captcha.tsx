import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface CaptchaProps {
  onError?: () => void;
  className?: string;
  action?: string;
}

export interface CaptchaRef {
  reset: () => void;
  execute: () => Promise<string | null>;
}

// Declare global grecaptcha for TypeScript
declare global {
  interface Window {
    grecaptcha: any;
  }
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ onError, className = '', action = 'vote' }, ref) => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        // For v3, we don't need to reset - just execute again when needed
      },
      execute: async () => {
        if (!window.grecaptcha || !window.grecaptcha.ready) {
          console.error('reCAPTCHA not loaded');
          onError?.();
          return null;
        }

        try {
          return await new Promise<string>((resolve, reject) => {
            window.grecaptcha.ready(() => {
              window.grecaptcha.execute(siteKey, { action }).then((token: string) => {
                resolve(token);
              }).catch((error: any) => {
                reject(error);
              });
            });
          });
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          onError?.();
          return null;
        }
      }
    }));

    useEffect(() => {
      if (!siteKey) {
        console.error('VITE_RECAPTCHA_SITE_KEY is not set in environment variables');
        return;
      }

      // Load reCAPTCHA v3 script
      const loadRecaptcha = () => {
        if (window.grecaptcha) {
          return; // Already loaded
        }

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      };

      loadRecaptcha();
    }, [siteKey]);

    if (!siteKey) {
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="text-red-600 text-sm">
            reCAPTCHA configuration missing. Please set VITE_RECAPTCHA_SITE_KEY in your .env file.
          </p>
        </div>
      );
    }

    // For v3, we show the reCAPTCHA badge (invisible component)
    // The actual verification happens when execute() is called
    return (
      <div className={`captcha-container ${className}`}>
        <div className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Protected by reCAPTCHA</span>
        </div>
      </div>
    );
  }
);

Captcha.displayName = 'Captcha';
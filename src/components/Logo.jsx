import { useTranslation } from 'react-i18next';

// The app is called "Vasuprada" (a name of Vishnu: the giver of wealth); the temple's name goes underneath.
// Brand mark: the Udupi Krishna idol. The close-up version (/logo-mark.svg, also the favicon) stays readable at
// header sizes; the full figure with the arch and lotus pedestal (/logo-krishna.svg) is used when shown larger.
// The wordmark is live text so it follows the app font and language.
export default function Logo({ size = 40, showText = true, title, subtitle, tone = 'light' }) {
  const { t } = useTranslation();

  const titleColor = tone === 'light' ? 'text-white' : 'text-ink';
  const subtitleColor = tone === 'light' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex items-center gap-3">
      <img src={size >= 64 ? '/logo-krishna.svg' : '/logo-mark.svg'} alt="Vasuprada" width={size} height={size} className="shrink-0" />
      {showText ? (
        <div className="min-w-0">
          <p className={`text-base font-semibold leading-tight tracking-tight ${titleColor}`}>{title ?? t('nav.appName')}</p>
          {subtitle ? <p className={`text-xs leading-snug ${subtitleColor}`}>{subtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

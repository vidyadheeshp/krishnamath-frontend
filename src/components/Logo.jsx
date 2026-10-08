// Brand mark (temple gopuram with a gold kalasha). Served from /logo-mark.svg so it is cached and
// shared with the favicon; the wordmark is live text so it follows the app font and language.
export default function Logo({ size = 40, showText = true, subtitle, tone = 'light' }) {
  const titleColor = tone === 'light' ? 'text-white' : 'text-ink';
  const subtitleColor = tone === 'light' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="flex items-center gap-3">
      <img src="/logo-mark.svg" alt="Sri Krishnamath & Sabhabhavan, Belagavi" width={size} height={size} className="shrink-0" />
      {showText ? (
        <div className="min-w-0">
          <p className={`text-sm font-semibold leading-tight ${titleColor}`}>Sri Krishnamath & Sabhabhavan, Belagavi</p>
          {subtitle ? <p className={`truncate text-xs ${subtitleColor}`}>{subtitle}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

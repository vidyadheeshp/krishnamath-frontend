import { useSearchParams } from 'react-router-dom';

// Keeps the selected year / month in the URL so a filtered view can be bookmarked or linked to.
export default function usePeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get('year')) || new Date().getFullYear();
  const month = Number(searchParams.get('month')) || 0;

  const setPeriod = (next) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(next).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params, { replace: true });
  };

  return { year, month, setPeriod };
}

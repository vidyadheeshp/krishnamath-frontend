// Names for the Hindu calendar (panchang) shown on the booking calendar. The API sends indexes; the names live here
// so they can be shown in English or Kannada.
export const TITHI = {
  en: ['Prathama', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'],
  kn: ['ಪಾಡ್ಯ', 'ಬಿದಿಗೆ', 'ತದಿಗೆ', 'ಚೌತಿ', 'ಪಂಚಮಿ', 'ಷಷ್ಠಿ', 'ಸಪ್ತಮಿ', 'ಅಷ್ಟಮಿ', 'ನವಮಿ', 'ದಶಮಿ', 'ಏಕಾದಶಿ', 'ದ್ವಾದಶಿ', 'ತ್ರಯೋದಶಿ', 'ಚತುರ್ದಶಿ'],
};
export const FULL_MOON = { en: 'Purnima', kn: 'ಹುಣ್ಣಿಮೆ' };
export const NEW_MOON = { en: 'Amavasya', kn: 'ಅಮಾವಾಸ್ಯೆ' };

export const PAKSHA = {
  en: { Shukla: 'Shukla', Krishna: 'Krishna' },
  kn: { Shukla: 'ಶುಕ್ಲ', Krishna: 'ಕೃಷ್ಣ' },
};

export const NAKSHATRA = {
  en: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
  kn: ['ಅಶ್ವಿನಿ', 'ಭರಣಿ', 'ಕೃತ್ತಿಕಾ', 'ರೋಹಿಣಿ', 'ಮೃಗಶಿರ', 'ಆರಿದ್ರಾ', 'ಪುನರ್ವಸು', 'ಪುಷ್ಯ', 'ಆಶ್ಲೇಷಾ', 'ಮಘಾ', 'ಪೂರ್ವ ಫಲ್ಗುಣಿ', 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಹಸ್ತ', 'ಚಿತ್ರಾ', 'ಸ್ವಾತಿ', 'ವಿಶಾಖಾ', 'ಅನುರಾಧಾ', 'ಜ್ಯೇಷ್ಠಾ', 'ಮೂಲ', 'ಪೂರ್ವಾಷಾಢ', 'ಉತ್ತರಾಷಾಢ', 'ಶ್ರವಣ', 'ಧನಿಷ್ಠಾ', 'ಶತಭಿಷ', 'ಪೂರ್ವಾಭಾದ್ರಪದ', 'ಉತ್ತರಾಭಾದ್ರಪದ', 'ರೇವತಿ'],
};

// Months in the Karnataka (Amanta) order, starting with Chaitra.
export const MASA = {
  en: ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwayuja', 'Kartika', 'Margashira', 'Pushya', 'Magha', 'Phalguna'],
  kn: ['ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ', 'ಶ್ರಾವಣ', 'ಭಾದ್ರಪದ', 'ಆಶ್ವಯುಜ', 'ಕಾರ್ತಿಕ', 'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'],
};
export const ADHIKA = { en: 'Adhika', kn: 'ಅಧಿಕ' };

export const VARA = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  kn: ['ಭಾನುವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶುಕ್ರವಾರ', 'ಶನಿವಾರ'],
};

export const YOGA = {
  en: ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarman', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
  kn: ['ವಿಷ್ಕಂಭ', 'ಪ್ರೀತಿ', 'ಆಯುಷ್ಮಾನ್', 'ಸೌಭಾಗ್ಯ', 'ಶೋಭನ', 'ಅತಿಗಂಡ', 'ಸುಕರ್ಮ', 'ಧೃತಿ', 'ಶೂಲ', 'ಗಂಡ', 'ವೃದ್ಧಿ', 'ಧ್ರುವ', 'ವ್ಯಾಘಾತ', 'ಹರ್ಷಣ', 'ವಜ್ರ', 'ಸಿದ್ಧಿ', 'ವ್ಯತೀಪಾತ', 'ವರೀಯಾನ್', 'ಪರಿಘ', 'ಶಿವ', 'ಸಿದ್ಧ', 'ಸಾಧ್ಯ', 'ಶುಭ', 'ಶುಕ್ಲ', 'ಬ್ರಹ್ಮ', 'ಇಂದ್ರ', 'ವೈಧೃತಿ'],
};

// Keyed by the name the API sends.
export const KARANA_KN = {
  Bava: 'ಬವ',
  Balava: 'ಬಾಲವ',
  Kaulava: 'ಕೌಲವ',
  Taitila: 'ತೈತಿಲ',
  Gara: 'ಗರ',
  Vanija: 'ವಣಿಜ',
  Vishti: 'ವಿಷ್ಟಿ',
  Shakuni: 'ಶಕುನಿ',
  Chatushpada: 'ಚತುಷ್ಪಾದ',
  Naga: 'ನಾಗ',
  Kimstughna: 'ಕಿಂಸ್ತುಘ್ನ',
};

const pick = (names, lang) => names[lang === 'kn' ? 'kn' : 'en'];

// Tithi 0-29: 0-13 Shukla Prathama..Chaturdashi, 14 Purnima, 15-28 Krishna Prathama..Chaturdashi, 29 Amavasya.
export const tithiName = (tithi, lang) => {
  if (tithi === 14) return pick(FULL_MOON, lang);
  if (tithi === 29) return pick(NEW_MOON, lang);
  return pick(TITHI, lang)[tithi % 15];
};
export const pakshaName = (paksha, lang) => pick(PAKSHA, lang)[paksha];
export const nakshatraName = (nakshatra, lang) => pick(NAKSHATRA, lang)[nakshatra];
export const masaName = (masa, adhika, lang) => `${adhika ? `${pick(ADHIKA, lang)} ` : ''}${pick(MASA, lang)[masa]}`;
export const varaName = (vara, lang) => pick(VARA, lang)[vara];
export const yogaName = (yoga, lang) => pick(YOGA, lang)[yoga];
export const karanaName = (karana, lang) => (lang === 'kn' ? KARANA_KN[karana] ?? karana : karana);

// The five limbs of the day (panchanga) as { key, value, until } in the chosen language; 'until' is when it ends.
export const panchangLimbs = (day, lang) => [
  { key: 'tithi', value: `${pakshaName(day.paksha, lang)} ${tithiName(day.tithi, lang)}`, until: day.tithiEnd },
  { key: 'vara', value: varaName(day.vara, lang), until: null },
  { key: 'nakshatra', value: nakshatraName(day.nakshatra, lang), until: day.nakshatraEnd },
  { key: 'yoga', value: yogaName(day.yoga, lang), until: day.yogaEnd },
  { key: 'karana', value: karanaName(day.karana, lang), until: day.karanaEnd },
];

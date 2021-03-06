import mergeWithDefaultOptions from './utils/mergeWithDefaultOptions';
import katakanaToHiragana from './utils/katakanaToHiragana';
import isKatakana from './isKatakana';
import { getKanaToRomajiTree } from './utils/kanaToRomajiMap';
import { applyMapping, mergeCustomMapping } from './utils/kanaMapping';

/**
 * Convert kana to romaji
 * @param  {String} kana text input
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toRomaji('ひらがな　カタカナ')
 * // => 'hiragana katakana'
 * toRomaji('げーむ　ゲーム')
 * // => 'ge-mu geemu'
 * toRomaji('ひらがな　カタカナ', { upcaseKatakana: true })
 * // => 'hiragana KATAKANA'
 * toRomaji('つじぎり', { customRomajiMapping: { じ: 'zi', つ: 'tu', り: 'li' } });
 * // => 'tuzigili'
 */
export function toRomaji(input = '', options = {}) {
  const mergedOptions = mergeWithDefaultOptions(options);
  // just throw away the substring index information and just concatenate all the kana
  return splitIntoRomaji(input, mergedOptions)
    .map((romajiToken) => {
      const [start, end, romaji] = romajiToken;
      const makeUpperCase = options.upcaseKatakana && isKatakana(input.slice(start, end));
      return makeUpperCase ? romaji.toUpperCase() : romaji;
    })
    .join('');
}

let customMapping = null;
function splitIntoRomaji(input, options) {
  let map = getKanaToRomajiTree(options);

  if (options.customRomajiMapping) {
    if (customMapping == null) {
      customMapping = mergeCustomMapping(map, options.customRomajiMapping);
    }
    map = customMapping;
  }

  return applyMapping(katakanaToHiragana(input, toRomaji, true), map, !options.IMEMode);
}

function toRomajiSplit(input = '', options = {}) {
  const mergedOptions = mergeWithDefaultOptions(options);
  return splitIntoRomaji(input, mergedOptions);
}

export default {toRomaji, toRomajiSplit};

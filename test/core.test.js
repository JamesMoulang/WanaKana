import simulant from 'jsdom-simulant';

import { TO_KANA_METHODS } from '../src/constants';

import { ROMA_TO_HIRA_KATA, HIRA_KATA_TO_ROMA, JA_PUNC, EN_PUNC } from './helpers/testTables';

import isKana from '../src/isKana';
import isKanji from '../src/isKanji';
import isJapanese from '../src/isJapanese';
import isKatakana from '../src/isKatakana';
import isHiragana from '../src/isHiragana';
import isRomaji from '../src/isRomaji';
import isMixed from '../src/isMixed';
import { toKana, splitIntoKana } from '../src/toKana';
import toKatakana from '../src/toKatakana';
import toHiragana from '../src/toHiragana';
import toRomaji from '../src/toRomaji';
import stripOkurigana from '../src/stripOkurigana';
import tokenize from '../src/tokenize';
import bind from '../src/bind';
import unbind from '../src/unbind';
import { createCustomMapping } from '../src/utils/kanaMappingUtils';

describe('Methods should return valid defaults when given no input', () => {
  it('isKana() with no input', () => expect(isKana()).toBe(false));
  it('isKanji() with no input', () => expect(isKanji()).toBe(false));
  it('isJapanese() with no input', () => expect(isJapanese()).toBe(false));
  it('isKatakana() with no input', () => expect(isKatakana()).toBe(false));
  it('isHiragana() with no input', () => expect(isHiragana()).toBe(false));
  it('isRomaji() with no input', () => expect(isRomaji()).toBe(false));
  it('isMixed() with no input', () => expect(isMixed()).toBe(false));
  it('toKana() with no input', () => expect(toKana()).toBe(''));
  it('splitIntoKana() with no input', () => expect(splitIntoKana()).toEqual([]));
  it('toKatakana() with no input', () => expect(toKatakana()).toBe(''));
  it('toHiragana() with no input', () => expect(toHiragana()).toBe(''));
  it('toRomaji() with no input', () => expect(toRomaji()).toBe(''));
  it('stripOkurigana() with no input', () => expect(stripOkurigana()).toBe(''));
  it('tokenize() with no input', () => expect(tokenize()).toEqual(['']));
});

describe('Character type detection', () => {
  describe('isHiragana()', () => {
    it('あ is hiragana', () => expect(isHiragana('あ')).toBe(true));
    it('ああ is hiragana', () => expect(isHiragana('ああ')).toBe(true));
    it('ア is not hiragana', () => expect(isHiragana('ア')).toBe(false));
    it('A is not hiragana', () => expect(isHiragana('A')).toBe(false));
    it('あア is not hiragana', () => expect(isHiragana('あア')).toBe(false));
    it('ignores long dash in hiragana', () => expect(isHiragana('げーむ')).toBe(true));
  });

  describe('isKatakana()', () => {
    it('アア is katakana', () => expect(isKatakana('アア')).toBe(true));
    it('ア is katakana', () => expect(isKatakana('ア')).toBe(true));
    it('あ is not katakana', () => expect(isKatakana('あ')).toBe(false));
    it('A is not katakana', () => expect(isKatakana('A')).toBe(false));
    it('あア is not katakana', () => expect(isKatakana('あア')).toBe(false));
    it('ignores long dash in katakana', () => expect(isKatakana('ゲーム')).toBe(true));
  });

  describe('isKana()', () => {
    it('あ is kana', () => expect(isKana('あ')).toBe(true));
    it('ア is kana', () => expect(isKana('ア')).toBe(true));
    it('あア is kana', () => expect(isKana('あア')).toBe(true));
    it('A is not kana', () => expect(isKana('A')).toBe(false));
    it('あAア is not kana', () => expect(isKana('あAア')).toBe(false));
    it('ignores long dash in mixed kana', () => expect(isKana('アーあ')).toBe(true));
  });

  describe('isKanji()', () => {
    it('切腹 is kanji', () => expect(isKanji('切腹')).toBe(true));
    it('刀 is kanji', () => expect(isKanji('刀')).toBe(true));
    it('🐸 is not kanji', () => expect(isKanji('🐸')).toBe(false));
    it('あ is not kanji', () => expect(isKanji('あ')).toBe(false));
    it('ア is not kanji', () => expect(isKanji('ア')).toBe(false));
    it('あア is not kanji', () => expect(isKanji('あア')).toBe(false));
    it('A is not kanji', () => expect(isKanji('A')).toBe(false));
    it('あAア is not kanji', () => expect(isKanji('あAア')).toBe(false));
    it('１２隻 is not kanji', () => expect(isKanji('１２隻')).toBe(false));
    it('12隻 is not kanji', () => expect(isKanji('12隻')).toBe(false));
    it('隻。 is not kanji', () => expect(isKanji('隻。')).toBe(false));
  });

  describe('isJapanese()', () => {
    it('泣き虫 is japanese', () => expect(isJapanese('泣き虫')).toBe(true));
    it('あア is japanese', () => expect(isJapanese('あア')).toBe(true));
    it('A泣き虫 is not japanese', () => expect(isJapanese('A泣き虫')).toBe(false));
    it('A is not japanese', () => expect(isJapanese('A')).toBe(false));
    it('ja space is japanese', () => expect(isJapanese('　')).toBe(true));
    it('en space is not japanese', () => expect(isJapanese(' ')).toBe(false));
    it('泣き虫。！〜 (w. zenkaku punctuation) is japanese', () =>
      expect(isJapanese('泣き虫。＃！〜〈〉《》〔〕［］【】（）｛｝〝〟')).toBe(true));
    it('泣き虫.!~ (w. romaji punctuation) is not japanese', () =>
      expect(isJapanese('泣き虫.!~')).toBe(false));
    it('zenkaku numbers are considered neutral', () =>
      expect(isJapanese('０１２３４５６７８９')).toBe(true));
    it('latin numbers are considered neutral', () => expect(isJapanese('0123456789')).toBe(true));
    it('zenkaku latin letters are considered neutral', () => expect(isJapanese('ＭｅＴｏｏ')).toBe(true));
    it('mixed with numbers is japanese', () => expect(isJapanese('２０１１年')).toBe(true));
    it('hankaku katakana is allowed', () => expect(isJapanese('ﾊﾝｶｸｶﾀｶﾅ')).toBe(true));
    it('randomly selected web text is japanese', () =>
      expect(
        isJapanese(
          '＃ＭｅＴｏｏ、これを前に「ＫＵＲＯＳＨＩＯ」は、都内で報道陣を前に水中探査ロボットの最終点検の様子を公開しました。イルカのような形をした探査ロボットは、全長３メートル、重さは３５０キロあります。《はじめに》冒頭、安倍総理大臣は、ことしが明治元年から１５０年にあたることに触れ「明治という新しい時代が育てたあまたの人材が、技術優位の欧米諸国が迫る『国難』とも呼ぶべき危機の中で、わが国が急速に近代化を遂げる原動力となった。今また、日本は少子高齢化という『国難』とも呼ぶべき危機に直面している。もう１度、あらゆる日本人にチャンスを創ることで、少子高齢化も克服できる」と呼びかけました。《働き方改革》続いて安倍総理大臣は、具体的な政策課題の最初に「働き方改革」を取り上げ、「戦後の労働基準法制定以来、７０年ぶりの大改革だ。誰もが生きがいを感じて、その能力を思う存分発揮すれば少子高齢化も克服できる」と述べました。そして、同一労働同一賃金の実現や、時間外労働の上限規制の導入、それに労働時間でなく成果で評価するとして労働時間の規制から外す「高度プロフェッショナル制度」の創設などに取り組む考えを強調しました。'
        )
      ).toBe(true));
  });

  describe('isRomaji()', () => {
    it('A is romaji', () => expect(isRomaji('A')).toBe(true));
    it('xYz is romaji', () => expect(isRomaji('xYz')).toBe(true));
    it('Tōkyō and Ōsaka is romaji', () => expect(isRomaji('Tōkyō and Ōsaka')).toBe(true));
    it('あアA is not romaji', () => expect(isRomaji('あアA')).toBe(false));
    it('お願い is not romaji', () => expect(isRomaji('お願い')).toBe(false));
    it('熟成 is not romaji', () => expect(isRomaji('熟成')).toBe(false));
    it('passes latin punctuation', () => expect(isRomaji('a*b&c-d')).toBe(true));
    it('passes latin numbers', () => expect(isRomaji('0123456789')).toBe(true));
    it('fails zenkaku punctuation', () => expect(isRomaji('a！b&cーd')).toBe(false));
    it('fails zenkaku latin', () => expect(isRomaji('ｈｅｌｌｏ')).toBe(false));
  });

  describe('isMixed()', () => {
    it('Aア is mixed', () => expect(isMixed('Aア')).toBe(true));
    it('Aあ is mixed', () => expect(isMixed('Aあ')).toBe(true));
    it('Aあア is mixed', () => expect(isMixed('Aあア')).toBe(true));
    it('２あア is not mixed', () => expect(isMixed('２あア')).toBe(false));
    it('お腹A is mixed', () => expect(isMixed('お腹A')).toBe(true));
    it('お腹A is not mixed when { passKanji: false }', () =>
      expect(isMixed('お腹A', { passKanji: false })).toBe(false));
    it('お腹 is not mixed', () => expect(isMixed('お腹')).toBe(false));
    it('腹 is not mixed', () => expect(isMixed('腹')).toBe(false));
    it('A is not mixed', () => expect(isMixed('A')).toBe(false));
    it('あ is not mixed', () => expect(isMixed('あ')).toBe(false));
    it('ア is not mixed', () => expect(isMixed('ア')).toBe(false));
  });
});

describe('Character conversion', () => {
  describe('Quick Brown Fox - Romaji to Hiragana', () => {
    const options = { useObsoleteKana: true };
    // https://en.wikipedia.org/wiki/Iroha
    // Even the colorful fragrant flowers'
    expect(toHiragana('IROHANIHOHETO', options)).toBe('いろはにほへと');
    // die sooner or later.'
    expect(toHiragana('CHIRINURUWO', options)).toBe('ちりぬるを');
    // Us who live in this world'
    expect(toHiragana('WAKAYOTARESO', options)).toBe('わかよたれそ');
    // cannot live forever, either.'
    expect(toHiragana('TSUNENARAMU', options)).toBe('つねならむ');
    // This transient mountain with shifts and changes,'
    expect(toHiragana('UWINOOKUYAMA', options)).toBe('うゐのおくやま');
    // today we are going to overcome, and reach the world of enlightenment.'
    expect(toHiragana('KEFUKOETE', options)).toBe('けふこえて');
    // We are not going to have meaningless dreams'
    expect(toHiragana('ASAKIYUMEMISHI', options)).toBe('あさきゆめみし');
    // nor become intoxicated with the fake world anymore.'
    expect(toHiragana('WEHIMOSESU', options)).toBe('ゑひもせす');
    // *not in iroha*
    expect(toHiragana('NLTU')).toBe('んっ');
  });

  describe('Test every character with toKana(), toHiragana(), and toKatakana()', () => {
    describe('toKana()', () => {
      ROMA_TO_HIRA_KATA.forEach((item) => {
        const [romaji, hiragana, katakana] = item;
        const lower = toKana(romaji);
        const upper = toKana(romaji.toUpperCase());
        it(`${romaji}`, () => expect(lower).toBe(hiragana));
        it(`${romaji.toUpperCase()}`, () => expect(upper).toBe(katakana));
      });
    });

    describe('toHiragana()', () => {
      ROMA_TO_HIRA_KATA.forEach((item) => {
        const [romaji, hiragana] = item;
        const lower = toHiragana(romaji);
        const upper = toHiragana(romaji.toUpperCase());
        it(`${romaji}`, () => expect(lower).toBe(hiragana));
        it(`${romaji.toUpperCase()}`, () => expect(upper).toBe(hiragana));
      });
    });

    describe('toKatakana()', () => {
      ROMA_TO_HIRA_KATA.forEach((item) => {
        const [romaji, , katakana] = item;
        const lower = toKatakana(romaji);
        const upper = toKatakana(romaji.toUpperCase());
        it(`${romaji}`, () => expect(lower).toBe(katakana));
        it(`${romaji.toUpperCase()}`, () => expect(upper).toBe(katakana));
      });
    });
  });

  describe('Test custom mappings options', () => {
    it('applies customKanaMapping', () => {
      expect(
        toKana('WanaKana', {
          customKanaMapping: createCustomMapping({ na: 'に', ka: 'Bana' }),
        })
      ).toBe('ワにBanaに');
    })

    it("can't romanize with an invalid method", () => {
      expect(toRomaji('つじぎり', { romanization: "it's called rōmaji!!!" })).toBe('つじぎり');
    });

    it('applies customRomajiMapping', () => {
      expect(
        toRomaji('つじぎり', {
          customRomajiMapping: createCustomMapping({ じ: 'zi', つ: 'tu', り: 'li' }),
        })
      ).toBe('tuzigili');
    })

    it('will accept a plain object and merge it internally via createCustomMapping()', () => {
      expect(
        toKana('WanaKana', {
          customKanaMapping: { na: 'に', ka: 'Bana' },
        })
      ).toBe('ワにBanaに');

      expect(
        toRomaji('つじぎり', {
          customRomajiMapping: { じ: 'zi', つ: 'tu', り: 'li' },
        })
      ).toBe('tuzigili');

    });
  });

  describe('toKana()', () => {
    it('Lowercase characters are transliterated to hiragana.', () =>
      expect(toKana('onaji')).toBe('おなじ'));

    it('Lowercase with double consonants and double vowels are transliterated to hiragana.', () =>
      expect(toKana('buttsuuji')).toBe('ぶっつうじ'));

    it('Uppercase characters are transliterated to katakana.', () =>
      expect(toKana('ONAJI')).toBe('オナジ'));

    it('Uppercase with double consonants and double vowels are transliterated to katakana.', () =>
      expect(toKana('BUTTSUUJI')).toBe('ブッツウジ'));

    it('WaniKani -> ワにカに - Mixed case uses the first character for each syllable.', () =>
      expect(toKana('WaniKani')).toBe('ワにカに'));

    it('Non-romaji will be passed through.', () =>
      expect(toKana('ワニカニ AiUeO 鰐蟹 12345 @#$%')).toBe('ワニカニ アいウえオ 鰐蟹 12345 @#$%'));

    it('It handles mixed syllabaries', () =>
      expect(toKana('座禅‘zazen’スタイル')).toBe('座禅「ざぜん」スタイル'));

    it('Will convert short to long dashes', () => expect(toKana('batsuge-mu')).toBe('ばつげーむ'));

    it('Will convert punctuation but pass through spaces', () =>
      expect(toKana(EN_PUNC.join(' '))).toBe(JA_PUNC.join(' ')));
  });

  describe('splitIntoKana()', () => {
    it('Lowercase characters are transliterated to hiragana.', () =>
      expect(splitIntoKana('onaji')).toEqual([[0, 1, 'お'], [1, 3, 'な'], [3, 5, 'じ']]));

    it('Lowercase with double consonants and double vowels are transliterated to hiragana.', () =>
      expect(splitIntoKana('buttsuuji')).toEqual([
        [0, 2, 'ぶ'],
        [2, 6, 'っつ'],
        [6, 7, 'う'],
        [7, 9, 'じ'],
      ]));

    it('Non-romaji will be passed through.', () =>
      expect(splitIntoKana('ワニカニ AiUeO 鰐蟹 12345 @#$%')).toEqual([
        [0, 1, 'ワ'],
        [1, 2, 'ニ'],
        [2, 3, 'カ'],
        [3, 4, 'ニ'],
        [4, 5, ' '],
        [5, 6, 'あ'],
        [6, 7, 'い'],
        [7, 8, 'う'],
        [8, 9, 'え'],
        [9, 10, 'お'],
        [10, 11, ' '],
        [11, 12, '鰐'],
        [12, 13, '蟹'],
        [13, 14, ' '],
        [14, 15, '1'],
        [15, 16, '2'],
        [16, 17, '3'],
        [17, 18, '4'],
        [18, 19, '5'],
        [19, 20, ' '],
        [20, 21, '@'],
        [21, 22, '#'],
        [22, 23, '$'],
        [23, 24, '%'],
      ]));

    it('It handles mixed syllabaries', () =>
      expect(splitIntoKana('座禅‘zazen’スタイル')).toEqual([
        [0, 1, '座'],
        [1, 2, '禅'],
        [2, 3, '「'],
        [3, 5, 'ざ'],
        [5, 7, 'ぜ'],
        [7, 8, 'ん'],
        [8, 9, '」'],
        [9, 10, 'ス'],
        [10, 11, 'タ'],
        [11, 12, 'イ'],
        [12, 13, 'ル'],
      ]));

    it('Will convert short to long dashes', () =>
      expect(splitIntoKana('batsuge-mu')).toEqual([
        [0, 2, 'ば'],
        [2, 5, 'つ'],
        [5, 7, 'げ'],
        [7, 8, 'ー'],
        [8, 10, 'む'],
      ]));

    it('Will convert punctuation but pass through spaces', () =>
      expect(splitIntoKana(EN_PUNC.join(' '))).toEqual([
        [0, 1, '！'],
        [1, 2, ' '],
        [2, 3, '？'],
        [3, 4, ' '],
        [4, 5, '。'],
        [5, 6, ' '],
        [6, 7, '：'],
        [7, 8, ' '],
        [8, 9, '・'],
        [9, 10, ' '],
        [10, 11, '、'],
        [11, 12, ' '],
        [12, 13, '〜'],
        [13, 14, ' '],
        [14, 15, 'ー'],
        [15, 16, ' '],
        [16, 17, '「'],
        [17, 18, ' '],
        [18, 19, '」'],
        [19, 20, ' '],
        [20, 21, '『'],
        [21, 22, ' '],
        [22, 23, '』'],
        [23, 24, ' '],
        [24, 25, '［'],
        [25, 26, ' '],
        [26, 27, '］'],
        [27, 28, ' '],
        [28, 29, '（'],
        [29, 30, ' '],
        [30, 31, '）'],
        [31, 32, ' '],
        [32, 33, '｛'],
        [33, 34, ' '],
        [34, 35, '｝'],
      ]));
  });

  describe('Converting kana to kana', () => {
    it('k -> h', () => expect(toHiragana('バケル')).toBe('ばける'));
    it('h -> k', () => expect(toKatakana('ばける')).toBe('バケル'));

    it('It survives only katakana toKatakana', () =>
      expect(toKatakana('スタイル')).toBe('スタイル'));
    it('It survives only hiragana toHiragana', () =>
      expect(toHiragana('すたーいる')).toBe('すたーいる'));
    it('Mixed kana converts every char k -> h', () =>
      expect(toKatakana('アメリカじん')).toBe('アメリカジン'));
    it('Mixed kana converts every char h -> k', () =>
      expect(toHiragana('アメリカじん')).toBe('あめりかじん'));

    describe('long vowels', () => {
      it('Converts long vowels correctly from k -> h', () =>
        expect(toHiragana('バツゴー')).toBe('ばつごう'));
      it('Preserves long dash from h -> k', () =>
        expect(toKatakana('ばつゲーム')).toBe('バツゲーム'));
      it('Preserves long dash from h -> h', () =>
        expect(toHiragana('ばつげーむ')).toBe('ばつげーむ'));
      it('Preserves long dash from k -> k', () =>
        expect(toKatakana('バツゲーム')).toBe('バツゲーム'));
      it('Preserves long dash from mixed -> k', () =>
        expect(toKatakana('バツゲーム')).toBe('バツゲーム'));
      it('Preserves long dash from mixed -> k', () =>
        expect(toKatakana('テスーと')).toBe('テスート'));
      it('Preserves long dash from mixed -> h', () =>
        expect(toHiragana('てすート')).toBe('てすーと'));
      it('Preserves long dash from mixed -> h', () =>
        expect(toHiragana('てすー戸')).toBe('てすー戸'));
      it('Preserves long dash from mixed -> h', () =>
        expect(toHiragana('手巣ート')).toBe('手巣ーと'));
      it('Preserves long dash from mixed -> h', () =>
        expect(toHiragana('tesート')).toBe('てsーと'));
      it('Preserves long dash from mixed -> h', () =>
        expect(toHiragana('ートtesu')).toBe('ーとてす'));
    });

    describe('Mixed syllabaries', () => {
      it('It passes non-katakana through when passRomaji is true k -> h', () =>
        expect(toHiragana('座禅‘zazen’スタイル', { passRomaji: true })).toBe(
          '座禅‘zazen’すたいる'
        ));

      it('It passes non-hiragana through when passRomaji is true h -> k', () =>
        expect(toKatakana('座禅‘zazen’すたいる', { passRomaji: true })).toBe(
          '座禅‘zazen’スタイル'
        ));

      it('It converts non-katakana when passRomaji is false k -> h', () =>
        expect(toHiragana('座禅‘zazen’スタイル')).toBe('座禅「ざぜん」すたいる'));

      it('It converts non-hiragana when passRomaji is false h -> k', () =>
        expect(toKatakana('座禅‘zazen’すたいる')).toBe('座禅「ザゼン」スタイル'));
    });
  });

  describe('Case sensitivity', () => {
    it("cAse DoEsn'T MatTER for toHiragana()", () =>
      expect(toHiragana('aiueo')).toBe(toHiragana('AIUEO')));
    it("cAse DoEsn'T MatTER for toKatakana()", () =>
      expect(toKatakana('aiueo')).toBe(toKatakana('AIUEO')));
    it('Case DOES matter for toKana()', () => expect(toKana('aiueo')).not.toBe(toKana('AIUEO')));
  });

  describe('N edge cases', () => {
    it('Solo N', () => expect(toKana('n')).toBe('ん'));
    it('double N', () => expect(toKana('onn')).toBe('おんん'));
    it('N followed by N* syllable', () => expect(toKana('onna')).toBe('おんな'));
    it('Triple N', () => expect(toKana('nnn')).toBe('んんん'));
    it('Triple N followed by N* syllable', () => expect(toKana('onnna')).toBe('おんんな'));
    it('Quadruple N', () => expect(toKana('nnnn')).toBe('んんんん'));
    it('nya -> にゃ', () => expect(toKana('nyan')).toBe('にゃん'));
    it('nnya -> んにゃ', () => expect(toKana('nnyann')).toBe('んにゃんん'));
    it('nnnya -> んにゃ', () => expect(toKana('nnnyannn')).toBe('んんにゃんんん'));
    it("n'ya -> んや", () => expect(toKana("n'ya")).toBe('んや'));
    it("kin'ya -> きんや", () => expect(toKana("kin'ya")).toBe('きんや'));
    it("shin'ya -> しんや", () => expect(toKana("shin'ya")).toBe('しんや'));
    it('kinyou -> きにょう', () => expect(toKana('kinyou')).toBe('きにょう'));
    it("kin'you -> きんよう", () => expect(toKana("kin'you")).toBe('きんよう'));
    it("kin'yu -> きんゆ", () => expect(toKana("kin'yu")).toBe('きんゆ'));
    it('Properly add space after "n[space]"', () =>
      expect(toKana('ichiban warui')).toBe('いちばん わるい'));
  });

  describe('Bogus 4 character sequences', () => {
    it('Non bogus sequences work', () => expect(toKana('chya')).toBe('ちゃ'));
    it('Bogus sequences do not work', () => expect(toKana('chyx')).toBe('chyx'));
    it('Bogus sequences do not work', () => expect(toKana('shyp')).toBe('shyp'));
    it('Bogus sequences do not work', () => expect(toKana('ltsb')).toBe('ltsb'));
  });
});

describe('Kana to Romaji', () => {
  describe('toRomaji()', () => {
    it('Convert katakana to romaji', () =>
      expect(toRomaji('ワニカニ　ガ　スゴイ　ダ')).toBe('wanikani ga sugoi da'));

    it('Convert hiragana to romaji', () =>
      expect(toRomaji('わにかに　が　すごい　だ')).toBe('wanikani ga sugoi da'));

    it('Convert mixed kana to romaji', () =>
      expect(toRomaji('ワニカニ　が　すごい　だ')).toBe('wanikani ga sugoi da'));

    it('Will convert punctuation and full-width spaces', () =>
      expect(toRomaji(JA_PUNC.join(''))).toBe(EN_PUNC.join('')));

    it('Use the upcaseKatakana flag to preserve casing. Works for katakana.', () =>
      expect(toRomaji('ワニカニ', { upcaseKatakana: true })).toBe('WANIKANI'));

    it('Use the upcaseKatakana flag to preserve casing. Works for mixed kana.', () =>
      expect(toRomaji('ワニカニ　が　すごい　だ', { upcaseKatakana: true })).toBe(
        'WANIKANI ga sugoi da'
      ));

    it("Doesn't mangle the long dash 'ー' or slashdot '・'", () =>
      expect(toRomaji('罰ゲーム・ばつげーむ')).toBe('罰geemu/batsuge-mu'));

    it("Doesn't mangle the long dash 'ー' or slashdot '・'", () =>
      expect(toRomaji('罰ゲーム・ばつげーむ')).toBe('罰geemu/batsuge-mu'));

    it('Spaces must be manually entered', () =>
      expect(toRomaji('わにかにがすごいだ')).not.toBe('wanikani ga sugoi da'));
  });

  describe('Test every character with toRomaji()', () => {
    describe('Hiragana input toRomaji()', () => {
      HIRA_KATA_TO_ROMA.forEach((item) => {
        const [hiragana, , romaji] = item;
        const result = toRomaji(hiragana);
        it(`${hiragana}`, () => expect(result).toBe(romaji));
      });
    });
    describe('Katakana input toRomaji()', () => {
      HIRA_KATA_TO_ROMA.forEach((item) => {
        const [, katakana, romaji] = item;
        const result = toRomaji(katakana);
        it(`${katakana}`, () => expect(result).toBe(romaji));
      });
    });
  });

  describe("double n's and double consonants", () => {
    it('Double and single n', () => expect(toRomaji('きんにくまん')).toBe('kinnikuman'));
    it('N extravaganza', () => expect(toRomaji('んんにんにんにゃんやん')).toBe("nnninninnyan'yan"));
    it('Double consonants', () =>
      expect(toRomaji('かっぱ　たった　しゅっしゅ ちゃっちゃ　やっつ')).toBe(
        'kappa tatta shusshu chatcha yattsu'
      ));
  });

  describe('Small kana', () => {
    it("Small tsu doesn't transliterate", () => expect(toRomaji('っ')).toBe(''));
    it('Small ya', () => expect(toRomaji('ゃ')).toBe('ya'));
    it('Small yu', () => expect(toRomaji('ゅ')).toBe('yu'));
    it('Small yo', () => expect(toRomaji('ょ')).toBe('yo'));
    it('Small a', () => expect(toRomaji('ぁ')).toBe('a'));
    it('Small i', () => expect(toRomaji('ぃ')).toBe('i'));
    it('Small u', () => expect(toRomaji('ぅ')).toBe('u'));
    it('Small e', () => expect(toRomaji('ぇ')).toBe('e'));
    it('Small o', () => expect(toRomaji('ぉ')).toBe('o'));
  });

  describe('Apostrophes in ambiguous consonant vowel combos', () => {
    it('おんよみ', () => expect(toRomaji('おんよみ')).toBe("on'yomi"));
    it('んよ んあ んゆ', () => expect(toRomaji('んよ んあ んゆ')).toBe("n'yo n'a n'yu"));
  });
});

describe('stripOkurigana', () => {
  it('passes default parameter tests', () => {
    expect(stripOkurigana('ふふフフ')).toBe('ふふフフ');
    expect(stripOkurigana('ふaふbフcフ')).toBe('ふaふbフcフ');
    expect(stripOkurigana('お腹')).toBe('お腹');
    expect(stripOkurigana('踏み込む')).toBe('踏み込');
    expect(stripOkurigana('お祝い')).toBe('お祝');
    expect(stripOkurigana('粘り')).toBe('粘');
    expect(stripOkurigana('〜い海軍い、。')).toBe('〜い海軍、。');
  });
  it('strips all kana when passed optional config', () => {
    expect(stripOkurigana('お腹', { all: true })).toBe('腹');
    expect(stripOkurigana('踏み込む', { all: true })).toBe('踏込');
    expect(stripOkurigana('お祝い', { all: true })).toBe('祝');
    expect(stripOkurigana('お踏み込む', { all: true })).toBe('踏込');
    expect(stripOkurigana('〜い海軍い、。', { all: true })).toBe('〜海軍、。');
  });
});

describe('tokenize', () => {
  it('passes default parameter tests', () => {
    expect(tokenize('ふふ')).toEqual(['ふふ']);
    expect(tokenize('フフ')).toEqual(['フフ']);
    expect(tokenize('ふふフフ')).toEqual(['ふふ', 'フフ']);
    expect(tokenize('阮咸')).toEqual(['阮咸']);
    expect(tokenize('感じ')).toEqual(['感', 'じ']);
    expect(tokenize('私は悲しい')).toEqual(['私', 'は', '悲', 'しい']);
    expect(tokenize('what the...私は「悲しい」。')).toEqual([
      'what the...',
      '私',
      'は',
      '「',
      '悲',
      'しい',
      '」。',
    ]);
  });
});

describe('Event listener helpers', () => {
  document.body.innerHTML = `
      <div>
        <input id="ime" type="text" />
        <textarea id="ime2"></textarea>
        <input id="ime3" type="text" />
        <input class="has-no-id" type="text" />
      </div>
    `;
  const inputField1 = document.querySelector('#ime');
  const inputField2 = document.querySelector('#ime2');
  const inputField3 = document.querySelector('.has-no-id');

  it('fails safely with console warning when invalid element passed', () => {
    expect(() => bind()).not.toThrow();
    expect(() => bind('nerp')).not.toThrow();
    expect(() => unbind()).not.toThrow();
    expect(() => unbind('nerp')).not.toThrow();
  });

  it('adds onInput event listener', () => {
    bind(inputField1);
    inputField1.value = 'wanakana';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('わなかな');
    expect(inputField1.getAttribute('data-wanakana-id')).toBeDefined();
  });

  it('forces autocapitalize "none"', () => {
    expect(inputField1.autocapitalize).toEqual('none');
  });

  it('removes onInput event listener', () => {
    unbind(inputField1);
    inputField1.value = 'fugu';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('fugu');
    expect(inputField1.getAttribute('data-wanakana-id')).toBeNull();
  });

  it('forces IMEMode true if option not specified', () => {
    bind(inputField1);
    inputField1.value = "n'";
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('ん');
    unbind(inputField1);
  });

  it('should handle an options object', () => {
    bind(inputField1, { useObsoleteKana: true });
    inputField1.value = 'wiweWIWEwo';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('ゐゑヰヱを');
    unbind(inputField1);
  });

  it('should allow conversion type selection', () => {
    bind(inputField1, { IMEMode: TO_KANA_METHODS.KATAKANA });
    bind(inputField2, { IMEMode: TO_KANA_METHODS.HIRAGANA });
    inputField1.value = 'amerika';
    inputField2.value = 'KURO';
    simulant.fire(inputField1, 'input');
    simulant.fire(inputField2, 'input');
    expect(inputField1.value).toEqual('アメリカ');
    expect(inputField2.value).toEqual('くろ');
    unbind(inputField1);
    unbind(inputField2);
  });

  it('should instantiate separate onInput bindings', () => {
    bind(inputField1, {});
    bind(inputField2, { useObsoleteKana: true });
    inputField1.value = 'WIWEwiwe';
    inputField2.value = 'WIWEwiwe';
    simulant.fire(inputField1, 'input');
    simulant.fire(inputField2, 'input');
    expect(inputField1.value).toEqual('ウィウェうぃうぇ');
    expect(inputField2.value).toEqual('ヰヱゐゑ');
    unbind(inputField1);
    unbind(inputField2);
  });

  it('should keep track of separate onInput bindings if element has no id', () => {
    bind(inputField2);
    bind(inputField3);
    inputField2.value = 'wana';
    inputField3.value = 'kana';
    simulant.fire(inputField2, 'input');
    simulant.fire(inputField3, 'input');
    expect(inputField2.value).toEqual('わな');
    expect(inputField3.value).toEqual('かな');
    unbind(inputField2);
    unbind(inputField3);
  });

  it('ignores double consonants following composeupdate', () => {
    bind(inputField1);
    inputField1.value = 'かｔ';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('かｔ');
    inputField1.value = 'かｔｔ';
    // have to fake it... no compositionupdate in jsdom
    inputField1.dispatchEvent(
      new CustomEvent('compositionupdate', {
        bubbles: true,
        cancellable: true,
        detail: { data: 'かｔｔ' },
      })
    );
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('かｔｔ');
    unbind(inputField1);
  });

  it('should handle nonascii', () => {
    bind(inputField1);
    inputField1.value = 'ｈｉｒｏｉ';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('ひろい');
    // skips setting value if conversion would be the same
    inputField1.value = 'かんじ';
    simulant.fire(inputField1, 'input');
    expect(inputField1.value).toEqual('かんじ');
    unbind(inputField1);
  });

  it('should keep the cursor at the correct position even after conversion', () => {
    bind(inputField1);
    const inputValue = 'sentaku';
    const expected = 'せんたく';
    const expectedCursorPositions = [0, 1, 1, 2, 3, 3, 4, 4];
    for (let index = 0; index < expected.length; index += 1) {
      inputField1.value = inputValue;
      inputField1.setSelectionRange(index, index);
      simulant.fire(inputField1, 'input');
      expect(inputField1.value).toEqual(expected);
      expect(inputField1.selectionStart).toBe(expectedCursorPositions[index]);
    }
    unbind(inputField1);
  });
  it('should keep the cursor at the correct position even after conversion', () => {
    bind(inputField1);
    const inputValue = 'senshitaku';
    const expected = 'せんしたく';
    const expectedCursorPositions = [0, 1, 1, 2, 3, 3, 3, 4, 4, 5, 5];
    for (let index = 0; index < expected.length; index += 1) {
      inputField1.value = inputValue;
      inputField1.setSelectionRange(index, index);
      simulant.fire(inputField1, 'input');
      expect(inputField1.value).toEqual(expected);
      expect(inputField1.selectionStart).toBe(expectedCursorPositions[index]);
    }
    unbind(inputField1);
  });
});

describe('IMEMode', () => {
  /**
   * Simulate real typing by calling the function on every character in sequence
   * @param  {String} input
   * @param  {Object} options
   * @return {String} converted romaji as kana
   */
  function testTyping(input, options) {
    let pos = 1;
    let text = input;
    const len = text.length;
    // console.log(`--${text}--`);
    while (pos <= len) {
      let buffer = text.slice(0, pos);
      const rest = text.slice(pos);
      buffer = toKana(buffer, options);
      // console.log(`${pos}:${buffer} <-${rest}`);
      text = buffer + rest;
      pos += 1;
    }
    return text;
  }

  it("Without IME mode, solo n's are transliterated.", () => expect(toKana('n')).toBe('ん'));
  it("Without IME mode, double n's are transliterated.", () => expect(toKana('nn')).toBe('んん'));

  it("With IME mode, solo n's are not transliterated.", () =>
    expect(testTyping('n', { IMEMode: true })).toBe('n'));
  it("With IME mode, solo n's are not transliterated, even when cursor has been relocated.", () =>
    // pretending k,a,n -> かん| then moving curosr to か|ん and typing 'n'
    expect(testTyping('かnん', { IMEMode: true })).toBe('かnん'));

  // NOTE: I think we need to store cursor location onInput, diff the text to remove any existing Japanese
  // before it is sent to toKana(), rather than our current processing of ALL text through toKana
  // then we can convert the new input as it is entered whilst
  // re-applying the previous existing text around it when setting the input field value on conversion
  // (all while setting the correct cursor location again :/ )
  it("With IME mode, solo n's are not transliterated, even when cursor has been relocated.", () =>
    // pretending k,a,n,a -> かな| then moving curosr to か|な and typing 'n,y'
    expect(testTyping('かnyな', { IMEMode: true })).toBe('かnyな'));
  it("With IME mode, double n's are transliterated.", () =>
    expect(testTyping('nn', { IMEMode: true })).toBe('ん'));
  it('With IME mode, n + space are transliterated.', () =>
    expect(testTyping('n ', { IMEMode: true })).toBe('ん'));
  it("With IME mode, n + ' are transliterated.", () =>
    expect(testTyping("n'", { IMEMode: true })).toBe('ん'));
  it('With IME mode, ni.', () => expect(testTyping('ni', { IMEMode: true })).toBe('に'));

  it('kan', () => expect(testTyping('kan', { IMEMode: true })).toBe('かn'));
  it('kanp', () => expect(testTyping('kanp', { IMEMode: true })).toBe('かんp'));
  it('kanpai!', () => expect(testTyping('kanpai', { IMEMode: true })).toBe('かんぱい'));
  it('nihongo', () => expect(testTyping('nihongo', { IMEMode: true })).toBe('にほんご'));

  it("y doesn't count as a consonant for IME", () =>
    expect(testTyping('ny', { IMEMode: true })).toBe('ny'));
  it('nya works as expected', () => expect(testTyping('nya', { IMEMode: true })).toBe('にゃ'));

  it("With IME mode, solo N's are not transliterated - katakana.", () =>
    expect(testTyping('N', { IMEMode: true })).toBe('N'));
  it("With IME mode, double N's are transliterated - katakana.", () =>
    expect(testTyping('NN', { IMEMode: true })).toBe('ン'));
  it('With IME mode, NI - katakana.', () => expect(testTyping('NI', { IMEMode: true })).toBe('ニ'));
  it('With IME mode - KAN - katakana', () =>
    expect(testTyping('KAN', { IMEMode: true })).toBe('カN'));
  it('With IME mode - NIHONGO - katakana', () =>
    expect(testTyping('NIHONGO', { IMEMode: true })).toBe('ニホンゴ'));
});

describe('Options', () => {
  describe('useObsoleteKana', () => {
    describe('toKana', () => {
      it('useObsoleteKana is false by default', () => expect(toKana('wi')).toBe('うぃ'));
      it('wi = ゐ (when useObsoleteKana is true)', () =>
        expect(toKana('wi', { useObsoleteKana: true })).toBe('ゐ'));
      it('we = ゑ (when useObsoleteKana is true)', () =>
        expect(toKana('we', { useObsoleteKana: true })).toBe('ゑ'));
      it('WI = ヰ (when useObsoleteKana is true)', () =>
        expect(toKana('WI', { useObsoleteKana: true })).toBe('ヰ'));
      it('WE = ヱ (when useObsoleteKana is true)', () =>
        expect(toKana('WE', { useObsoleteKana: true })).toBe('ヱ'));
    });

    describe('toHiragana', () => {
      it('useObsoleteKana is false by default', () => expect(toHiragana('wi')).toBe('うぃ'));
      it('wi = ゐ (when useObsoleteKana is true)', () =>
        expect(toHiragana('wi', { useObsoleteKana: true })).toBe('ゐ'));
      it('we = ゑ (when useObsoleteKana is true)', () =>
        expect(toHiragana('we', { useObsoleteKana: true })).toBe('ゑ'));
      it('wi = うぃ when useObsoleteKana is false', () =>
        expect(toHiragana('wi', { useObsoleteKana: false })).toBe('うぃ'));
    });

    describe('toKataKana', () => {
      it('wi = ウィ when useObsoleteKana is false', () =>
        expect(toKatakana('WI', { useObsoleteKana: false })).toBe('ウィ'));
      it('WI = ヰ (when useObsoleteKana is true)', () =>
        expect(toKatakana('wi', { useObsoleteKana: true })).toBe('ヰ'));
      it('WE = ヱ (when useObsoleteKana is true)', () =>
        expect(toKatakana('we', { useObsoleteKana: true })).toBe('ヱ'));
    });
  });
});

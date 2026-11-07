// 받침에 따라 조사 고르기: josa('목', '이에요', '예요') → '이에요'
export function hasBatchim(word: string): boolean {
  const hangul = [...word].reverse().find((ch) => ch >= '가' && ch <= '힣');
  return !!hangul && (hangul.charCodeAt(0) - 0xac00) % 28 !== 0;
}

export const josa = (word: string, withBatchim: string, without: string) =>
  word + (hasBatchim(word) ? withBatchim : without);

export interface DiffToken {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

/**
 * Computes a word-by-word diff between original spoken sentence and corrected sentence
 */
export function computeWordDiff(original: string, corrected: string): DiffToken[] {
  const origWords = original.trim().split(/\s+/).filter(Boolean);
  const corrWords = corrected.trim().split(/\s+/).filter(Boolean);

  if (original.trim().toLowerCase() === corrected.trim().toLowerCase()) {
    return [{ type: 'unchanged', text: original }];
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < origWords.length || j < corrWords.length) {
    const origWord = origWords[i];
    const corrWord = corrWords[j];

    if (i < origWords.length && j < corrWords.length) {
      // Normalize punctuation for comparison
      const cleanOrig = origWord.replace(/[^\w]/g, '').toLowerCase();
      const cleanCorr = corrWord.replace(/[^\w]/g, '').toLowerCase();

      if (cleanOrig === cleanCorr) {
        tokens.push({ type: 'unchanged', text: origWord });
        i++;
        j++;
      } else {
        // Look ahead to see if word matches later in corrected
        const nextCorrMatch = corrWords.slice(j, j + 3).findIndex(w => w.replace(/[^\w]/g, '').toLowerCase() === cleanOrig);
        const nextOrigMatch = origWords.slice(i, i + 3).findIndex(w => w.replace(/[^\w]/g, '').toLowerCase() === cleanCorr);

        if (nextCorrMatch > 0) {
          // Words were added in corrected
          for (let k = 0; k < nextCorrMatch; k++) {
            tokens.push({ type: 'added', text: corrWords[j + k] });
          }
          j += nextCorrMatch;
        } else if (nextOrigMatch > 0) {
          // Words were removed from original
          for (let k = 0; k < nextOrigMatch; k++) {
            tokens.push({ type: 'removed', text: origWords[i + k] });
          }
          i += nextOrigMatch;
        } else {
          // Direct replacement (mistake word -> corrected word)
          tokens.push({ type: 'removed', text: origWord });
          tokens.push({ type: 'added', text: corrWord });
          i++;
          j++;
        }
      }
    } else if (i < origWords.length) {
      tokens.push({ type: 'removed', text: origWord });
      i++;
    } else if (j < corrWords.length) {
      tokens.push({ type: 'added', text: corrWord });
      j++;
    }
  }

  return tokens;
}

export const SHATAK_PER_BIGHA = 33;

export function shatakToBigha(shatak: number): number {
  return shatak / SHATAK_PER_BIGHA;
}

export function bighaToShatak(bigha: number): number {
  return bigha * SHATAK_PER_BIGHA;
}

export function totalShatak(bigha: number, shatak: number): number {
  return bigha * SHATAK_PER_BIGHA + shatak;
}

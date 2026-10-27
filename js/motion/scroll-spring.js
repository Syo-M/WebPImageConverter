/**
 * 現在位置と速度から、次のフレームの位置を計算する臨界減衰のばねです。
 * 目的位置が変わっても位置・速度を引き継ぎ、入力ごとの段差を作りません。
 * DOMを操作しないので、時間間隔を変えて単独で検証できます。
 */
export function advanceScrollSpring(position, velocity, destination, elapsedSeconds) {
  const responseRate = 24; // 1秒あたりの追従の強さ。大きいほど目的位置へ早く近づきます。
  const distanceFromTarget = position - destination;
  // 位置のずれと現在の速度を合わせ、次の時刻の移動を連続した式で求めます。
  const motionCoefficient = velocity + responseRate * distanceFromTarget;
  // 指数関数で、経過時間に応じて動きがどれだけ残るかを計算します。
  const remainingRatio = Math.exp(-responseRate * elapsedSeconds);
  return {
    position: destination + (distanceFromTarget + motionCoefficient * elapsedSeconds) * remainingRatio,
    velocity: (velocity - responseRate * motionCoefficient * elapsedSeconds) * remainingRatio,
  };
}

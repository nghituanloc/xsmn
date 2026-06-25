import { appState } from './state.js';

export function clearRealtimeAnimationsInContainer(container) {
  if (!container) return;
  for (const [cell, state] of appState.realtimeAnimatingCells.entries()) {
    if (container.contains(cell)) {
      clearInterval(state.timerId);
      appState.realtimeAnimatingCells.delete(cell);
    }
  }
}

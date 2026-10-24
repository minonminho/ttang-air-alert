import { setTimeout } from 'node:timers/promises';

export function isTransientSearchError(error) {
  return ['FLIGHT_RESULTS_TIMEOUT', 'FLIGHT_TRIP_DEADLINE'].includes(error?.code) || error?.name === 'TimeoutError';
}

export async function withSearchDeadline(operation, timeoutMs, onTimeout = async () => {}) {
  let timer;
  const pending = Promise.resolve().then(operation);
  const deadline = new Promise((_, reject) => {
    timer = globalThis.setTimeout(() => reject(Object.assign(
      new Error(`일정 전체 검색 제한 ${Math.round(timeoutMs / 1000)}초를 초과했습니다.`),
      { code:'FLIGHT_TRIP_DEADLINE' },
    )), timeoutMs);
  });
  try {
    return await Promise.race([pending, deadline]);
  } catch (error) {
    if (error.code === 'FLIGHT_TRIP_DEADLINE') {
      await onTimeout(error);
      await pending.catch(() => {});
    }
    throw error;
  } finally { clearTimeout(timer); }
}

export async function retrySearchOnce(operation, { onRetry = () => {}, delay = () => setTimeout(2000) } = {}) {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientSearchError(error)) throw error;
    onRetry(error);
    await delay();
    return operation();
  }
}

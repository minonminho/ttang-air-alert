import { setTimeout } from 'node:timers/promises';

export function isTransientSearchError(error) {
  return error?.code === 'FLIGHT_RESULTS_TIMEOUT' || error?.name === 'TimeoutError';
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

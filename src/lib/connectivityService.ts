/**
 * Service for detecting and managing network connectivity
 */
export class ConnectivityService {
  private static listeners: Set<(isOnline: boolean) => void> = new Set();
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  /**
   * Initialize connectivity detection
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));

    console.log(`Connectivity initialized. Online: ${this.isOnline}`);
  }

  /**
   * Subscribe to connectivity changes
   */
  static subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    // Call immediately with current status
    listener(this.isOnline);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current online status
   */
  static getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Manually set online status and notify listeners
   */
  private static setOnline(status: boolean): void {
    if (this.isOnline === status) return;

    this.isOnline = status;
    console.log(`Network status changed: ${status ? 'Online' : 'Offline'}`);

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }

  /**
   * Test actual connectivity (ping Supabase or simple endpoint)
   */
  static async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      });
      return response.ok || response.status === 0; // status 0 means success with no-cors
    } catch {
      return false;
    }
  }
}

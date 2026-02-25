/**
 * Shipments Cache Service
 * Manages client-side caching of shipments data to avoid repeated API calls
 */

interface CachedShipments {
  data: any[];
  timestamp: number;
  expiresAt: number;
}

class ShipmentsCacheService {
  private static instance: ShipmentsCacheService;
  private cache: CachedShipments | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly CACHE_KEY = 'shipments_cache';

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): ShipmentsCacheService {
    if (!ShipmentsCacheService.instance) {
      ShipmentsCacheService.instance = new ShipmentsCacheService();
    }
    return ShipmentsCacheService.instance;
  }

  /**
   * Check if cached data is valid and not expired
   */
  public isValid(): boolean {
    if (!this.cache) return false;
    
    const now = Date.now();
    return now < this.cache.expiresAt;
  }

  /**
   * Get cached shipments data if valid
   */
  public getCachedData(): any[] | null {
    if (this.isValid()) {
      console.log('Using cached shipments data');
      return this.cache!.data;
    }
    
    // Clear expired cache
    this.clearCache();
    return null;
  }

  /**
   * Cache new shipments data
   */
  public setCachedData(shipments: any[]): void {
    const now = Date.now();
    this.cache = {
      data: shipments,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
    
    this.saveToStorage();
    console.log(`Cached ${shipments.length} shipments for ${this.CACHE_DURATION / 1000 / 60} minutes`);
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache = null;
    this.removeFromStorage();
    console.log('Shipments cache cleared');
  }

  /**
   * Get cache status information
   */
  public getCacheStatus(): {
    isValid: boolean;
    hasData: boolean;
    expiresIn: number;
    dataCount: number;
  } {
    const now = Date.now();
    return {
      isValid: this.isValid(),
      hasData: this.cache !== null,
      expiresIn: this.cache ? Math.max(0, this.cache.expiresAt - now) : 0,
      dataCount: this.cache ? this.cache.data.length : 0
    };
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
        // Check if cache is still valid
        if (!this.isValid()) {
          this.clearCache();
        }
      }
    } catch (error) {
      console.warn('Failed to load shipments cache from storage:', error);
      this.clearCache();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.cache) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
      }
    } catch (error) {
      console.warn('Failed to save shipments cache to storage:', error);
    }
  }

  /**
   * Remove cache from localStorage
   */
  private removeFromStorage(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.warn('Failed to remove shipments cache from storage:', error);
    }
  }

  /**
   * Force refresh - clear cache and fetch new data
   */
  public forceRefresh(): void {
    this.clearCache();
  }

  /**
   * Check if we should skip API call based on cache
   */
  public shouldSkipApiCall(): boolean {
    return this.isValid();
  }
}

export default ShipmentsCacheService;

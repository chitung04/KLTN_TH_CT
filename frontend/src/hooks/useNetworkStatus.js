import { useState, useEffect, useCallback } from 'react';

/**
 * Custom Hook for Network Status Detection and Offline Mode Handling
 * 
 * Monitors network connectivity and connection quality in real-time
 * Provides offline/online status and slow connection detection
 * 
 * Features:
 * - Real-time online/offline detection
 * - Slow connection detection using Network Information API
 * - Connection type detection (4g, 3g, 2g, wifi, etc.)
 * - Event listeners for connection changes
 * - Performance monitoring
 * 
 * Validates Requirements:
 * - Network error detection
 * - Offline mode handling
 * - Connection quality monitoring
 * 
 * @returns {Object} Network status information
 * @returns {boolean} isOnline - Whether device is connected to network
 * @returns {boolean} isSlowConnection - Whether connection is slow
 * @returns {string|null} connectionType - Type of connection (4g, wifi, etc.)
 * @returns {number|null} downlink - Download speed in Mbps
 * @returns {number|null} rtt - Round-trip time in ms
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: null,
    downlink: null,
    rtt: null,
    effectiveType: null
  });

  /**
   * Update network information from Network Information API
   */
  const updateNetworkInfo = useCallback(() => {
    // Get network connection info if available (not supported in all browsers)
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      const downlink = connection.downlink; // Mbps
      const rtt = connection.rtt; // milliseconds
      const type = connection.type; // 'wifi', 'cellular', 'ethernet', etc.

      // Determine if connection is slow based on effective type or metrics
      const isSlowConnection = 
        effectiveType === 'slow-2g' || 
        effectiveType === '2g' ||
        (downlink !== undefined && downlink < 1) || // Less than 1 Mbps
        (rtt !== undefined && rtt > 500); // RTT over 500ms

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection,
        connectionType: type || null,
        downlink: downlink || null,
        rtt: rtt || null,
        effectiveType: effectiveType || null
      });

      console.debug('Network status updated:', {
        isOnline: navigator.onLine,
        isSlowConnection,
        effectiveType,
        downlink,
        rtt,
        type
      });
    } else {
      // Network Information API not available, use basic online/offline only
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    }
  }, []);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    console.info('Network connection restored');
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    console.warn('Network connection lost');
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isSlowConnection: false
    }));
  }, []);

  /**
   * Handle connection change event
   */
  const handleConnectionChange = useCallback(() => {
    console.debug('Network connection changed');
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  useEffect(() => {
    // Initial network status check
    updateNetworkInfo();

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add event listener for connection changes (if supported)
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Optional: Periodic check for network status (every 30 seconds)
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        updateNetworkInfo();
      }
    }, 30000);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, handleConnectionChange, updateNetworkInfo]);

  return networkStatus;
};

/**
 * Custom Hook for Ping Test to Check Real Connectivity
 * 
 * Sometimes navigator.onLine returns true even when there's no actual internet
 * This hook performs a real HTTP request to verify connectivity
 * 
 * @param {string} url - URL to ping (default: current API base)
 * @param {number} interval - Check interval in ms (default: 30000)
 * @returns {Object} Ping status
 */
export const usePingTest = (url = null, interval = 30000) => {
  const [pingStatus, setPingStatus] = useState({
    isReachable: true,
    lastChecked: null,
    responseTime: null,
    checking: false
  });

  const performPing = useCallback(async () => {
    if (!navigator.onLine) {
      setPingStatus(prev => ({
        ...prev,
        isReachable: false,
        lastChecked: new Date(),
        checking: false
      }));
      return;
    }

    setPingStatus(prev => ({ ...prev, checking: true }));

    const pingUrl = url || process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
    const startTime = Date.now();

    try {
      // Perform a lightweight HEAD request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${pingUrl}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      setPingStatus({
        isReachable: response.ok,
        lastChecked: new Date(),
        responseTime,
        checking: false
      });

      console.debug(`Ping test: ${response.ok ? 'success' : 'failed'} (${responseTime}ms)`);
    } catch (error) {
      console.warn('Ping test failed:', error.message);
      setPingStatus({
        isReachable: false,
        lastChecked: new Date(),
        responseTime: null,
        checking: false
      });
    }
  }, [url]);

  useEffect(() => {
    // Initial ping
    performPing();

    // Periodic ping
    const intervalId = setInterval(performPing, interval);

    // Ping when coming back online
    const handleOnline = () => {
      console.info('Device came online, performing ping test');
      performPing();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
    };
  }, [performPing, interval]);

  return { ...pingStatus, refresh: performPing };
};

/**
 * Utility function to format connection speed
 */
export const formatConnectionSpeed = (downlink) => {
  if (!downlink) return 'Unknown';
  if (downlink >= 10) return 'Fast';
  if (downlink >= 1) return 'Good';
  if (downlink >= 0.5) return 'Slow';
  return 'Very Slow';
};

/**
 * Utility function to get user-friendly connection type name
 */
export const getConnectionTypeName = (effectiveType) => {
  const typeNames = {
    '4g': '4G',
    '3g': '3G',
    '2g': '2G',
    'slow-2g': '2G Chậm',
    'wifi': 'WiFi',
    'cellular': 'Di động',
    'ethernet': 'Ethernet'
  };
  return typeNames[effectiveType] || effectiveType || 'Unknown';
};

export default useNetworkStatus;

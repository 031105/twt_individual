// API Configuration
const API_CONFIG = {
    // Alpha Vantage API (Replace with your API key)
    ALPHA_VANTAGE: {
        API_KEY: 'YOUR_ALPHA_VANTAGE_API_KEY',
        BASE_URL: 'https://www.alphavantage.co/query',
        RATE_LIMIT: 5, // API calls per minute
        CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
    
    // Yahoo Finance API
    YAHOO_FINANCE: {
        BASE_URL: 'https://query1.finance.yahoo.com/v8/finance/chart',
        CACHE_DURATION: 1 * 60 * 1000, // 1 minute in milliseconds
    }
};

// Technical Indicators Configuration
const INDICATORS_CONFIG = {
    SMA: {
        DEFAULT_PERIODS: [20, 50, 200],
        COLORS: ['#ff6b6b', '#4ecdc4', '#45b7d1']
    },
    RSI: {
        DEFAULT_PERIOD: 14,
        OVERBOUGHT: 70,
        OVERSOLD: 30,
        COLOR: '#ff6b6b'
    },
    MACD: {
        FAST_PERIOD: 12,
        SLOW_PERIOD: 26,
        SIGNAL_PERIOD: 9,
        COLORS: {
            MACD: '#2196F3',
            SIGNAL: '#FF9800',
            HISTOGRAM: '#4CAF50'
        }
    }
};

// Chart Configuration
const CHART_CONFIG = {
    DEFAULT_THEME: 'light',
    THEMES: {
        light: {
            textColor: '#333333',
            gridColor: 'rgba(0, 0, 0, 0.1)',
            backgroundColor: '#ffffff'
        },
        dark: {
            textColor: '#ffffff',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            backgroundColor: '#1a1a1a'
        }
    },
    ZOOM_CONFIG: {
        zoom: {
            wheel: {
                enabled: true,
                speed: 0.05, // Slightly increased speed for better control
                modifierKey: null
            },
            pinch: {
                enabled: true,
                scale: 0.1 // Sensitivity for pinch gestures
            },
            mode: 'xy', // Allow zoom on both x and y axes
            onZoomComplete: function(chart) {
                console.log('Zoom completed');
            }
        },
        pan: {
            enabled: true,
            mode: 'xy', // Allow pan on both x and y axes
            threshold: 5, // Slightly higher threshold for stable pan activation
            rangeMin: {
                x: null, // Remove range limits for x
                y: null  // Remove range limits for y
            },
            rangeMax: {
                x: null, // Remove range limits for x
                y: null  // Remove range limits for y
            },
            onPanComplete: function(chart) {
                console.log('Pan completed');
            }
        }
        // Removed limits to allow unrestricted panning and zooming
    }
};

// Prediction Configuration
const PREDICTION_CONFIG = {
    MODELS: {
        LINEAR_REGRESSION: {
            LOOKBACK_PERIOD: 30,
            MIN_DATA_POINTS: 10
        },
        MOVING_AVERAGE: {
            PERIOD: 20,
            MIN_DATA_POINTS: 5
        },
        EXPONENTIAL_SMOOTHING: {
            ALPHA: 0.3,
            BETA: 0.1
        },
        AUTOREGRESSIVE: {
            ORDER: 3,
            MIN_DATA_POINTS: 15
        }
    },
    ACCURACY_THRESHOLDS: {
        EXCELLENT: 90,
        GOOD: 75,
        FAIR: 60,
        POOR: 40
    },
    CONFIDENCE_LEVELS: [80, 85, 90, 95, 99],
    DEFAULT_PREDICTION_DAYS: [1, 3, 7, 14, 30]
};

// Cache Configuration
const CACHE_CONFIG = {
    ENABLED: true,
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_ITEMS: 100
};

// Performance Configuration
const PERFORMANCE_CONFIG = {
    DEBOUNCE_DELAY: 300, // milliseconds
    THROTTLE_DELAY: 1000, // milliseconds
    MAX_CONCURRENT_REQUESTS: 3
};

// Export configurations
export {
    API_CONFIG,
    INDICATORS_CONFIG,
    CHART_CONFIG,
    PREDICTION_CONFIG,
    CACHE_CONFIG,
    PERFORMANCE_CONFIG
}; 
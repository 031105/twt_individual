import TechnicalIndicators from './utils/indicators.js';
import PredictionModels from './utils/prediction.js';
import { CHART_CONFIG, INDICATORS_CONFIG } from './config.js';

// Global variables
let stockChart = null;
let rsiChart = null;
let macdChart = null;
let currentTheme = CHART_CONFIG.DEFAULT_THEME;
let drawMode = false;
let signalMode = false;
let noteMode = false;
let tpSlMode = false;
let trendLinePoints = [];
let chartType = 'line'; // 'line' or 'candlestick'
let echartsInstance = null;
let tvChart = null;
let currentTimeframe = '1mo';
let currentStockData = null;
let predictionChart = null;

// Line drawing settings
let lineSettings = {
    color: '#FF0000',
    width: 2,
    style: 'solid'
};

// Chart annotations storage
let chartAnnotations = {
    lines: [],
    signals: [],
    notes: [],
    tpsl: []
};

// Persistent storage functions
function saveAnnotationsToStorage(symbol) {
    if (!symbol) return;
    
    try {
        const storageKey = `stock_annotations_${symbol}`;
        const annotationsData = {
            ...chartAnnotations,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(storageKey, JSON.stringify(annotationsData));
        console.log(`Annotations saved for ${symbol}`);
    } catch (error) {
        console.error('Failed to save annotations:', error);
    }
}

function loadAnnotationsFromStorage(symbol) {
    if (!symbol) return false;
    
    try {
        const storageKey = `stock_annotations_${symbol}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            const annotationsData = JSON.parse(savedData);
            
            // Validate data structure
            if (annotationsData.lines && annotationsData.signals && 
                annotationsData.notes && annotationsData.tpsl) {
                
                chartAnnotations = {
                    lines: annotationsData.lines || [],
                    signals: annotationsData.signals || [],
                    notes: annotationsData.notes || [],
                    tpsl: annotationsData.tpsl || []
                };
                
                console.log(`Annotations loaded for ${symbol}:`, chartAnnotations);
                showInfo(`Loaded saved drawings and annotations for ${symbol}`);
                return true;
            }
        }
    } catch (error) {
        console.error('Failed to load annotations:', error);
    }
    
    // Reset to empty if loading failed
    chartAnnotations = {
        lines: [],
        signals: [],
        notes: [],
        tpsl: []
    };
    
    return false;
}

// Drawing state
let isDrawing = false;
let drawingStartPoint = null;
let previewLineId = null;
let isDragging = false;
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };
let dragStartPosition = null;
let selectedAnnotation = null; // Track selected annotation for deletion

let tpSlState = {
    type: null, // 'bullish' or 'bearish'
    step: 0, // 0: entry, 1: stop loss, 2: take profit
    entry: null,
    stopLoss: null,
    takeProfit: null
};

// Indicator settings
let indicatorSettings = {
    sma: {
        period: 20,
        color: '#FF6B6B',
        lineWidth: 2,
        lineStyle: 'solid'
    },
    rsi: {
        period: INDICATORS_CONFIG.RSI.DEFAULT_PERIOD,
        overbought: INDICATORS_CONFIG.RSI.OVERBOUGHT,
        oversold: INDICATORS_CONFIG.RSI.OVERSOLD,
        color: INDICATORS_CONFIG.RSI.COLOR,
        lineWidth: 2,
        lineStyle: 'solid',
        overboughtColor: '#ff4444',
        oversoldColor: '#44ff44'
    },
    macd: {
        fastPeriod: INDICATORS_CONFIG.MACD.FAST_PERIOD,
        slowPeriod: INDICATORS_CONFIG.MACD.SLOW_PERIOD,
        signalPeriod: INDICATORS_CONFIG.MACD.SIGNAL_PERIOD,
        macdColor: INDICATORS_CONFIG.MACD.COLORS.MACD,
        signalColor: INDICATORS_CONFIG.MACD.COLORS.SIGNAL,
        histogramColor: INDICATORS_CONFIG.MACD.COLORS.HISTOGRAM,
        lineWidth: 2,
        lineStyle: 'solid'
    }
};

const HOT_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // 首先确保loading状态被清除
    showLoading(false);
    
    initializeEventListeners();
    setupThemeToggle();
    addEventListenersForDrawLine();
    renderHotStocks();
    loadSavedIndicatorPreferences();
    setupIndicatorSettings();
    initializeChartControls();
    initializePredictionSystem();
    initializeAnnotationSystem();
    setupKeyboardEventListeners(); // Add keyboard event listeners
    
    // Chart type controls
    document.getElementById('line-chart-btn').addEventListener('click', () => {
        chartType = 'line';
        toggleChartType();
    });
    
    document.getElementById('candlestick-chart-btn').addEventListener('click', () => {
        chartType = 'candlestick';
        toggleChartType();
    });
    
    // Timeframe selector
    document.getElementById('timeframe-select').addEventListener('change', (e) => {
        currentTimeframe = e.target.value;
        searchStock();
    });
    
    // URL parameter handling
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    
    if (symbol) {
        document.getElementById('stock-symbol').value = symbol;
        setTimeout(() => searchStock(), 300);
    } else {
        setTimeout(() => {
            document.getElementById('stock-symbol').value = 'AAPL';
            currentTimeframe = '1mo';
            document.getElementById('timeframe-select').value = '1mo';
            window.currentSymbol = 'AAPL'; // Set current symbol before searching
            searchStock();
        }, 300);
    }
    
    // 添加快捷键来手动隐藏loading（调试用）
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            clearAllLoadingIndicators();
            console.log('All loading indicators manually cleared');
        }
    });
    
    // 全局函数，可以在控制台调用
    window.clearAllLoadingIndicators = clearAllLoadingIndicators;
    
    // Save annotations before page unload
    window.addEventListener('beforeunload', () => {
        if (window.currentSymbol) {
            saveAnnotationsToStorage(window.currentSymbol);
        }
    });
});

// Initialize event listeners
function initializeEventListeners() {
    // Search button
    document.querySelector('button').addEventListener('click', searchStock);
    
    // Technical indicators
    document.getElementById('sma-checkbox').addEventListener('change', updateChart);
    document.getElementById('rsi-checkbox').addEventListener('change', updateChart);
    document.getElementById('macd-checkbox').addEventListener('change', updateChart);
    
    // Indicator dropdown and add button
    document.getElementById('add-indicator-btn').addEventListener('click', addSelectedIndicator);
    
    // Remove indicator buttons
    document.querySelectorAll('.remove-indicator').forEach(btn => {
        btn.addEventListener('click', function() {
            const indicator = this.dataset.indicator;
            removeIndicator(indicator);
        });
    });
    
    // Add keyboard support for search
    document.getElementById('stock-symbol').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    
    // Reset zoom button
    const resetZoomBtn = document.getElementById('reset-zoom-btn');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            if (stockChart && stockChart.resetZoom) {
                stockChart.resetZoom();
            } else if (stockChart) {
                // Fallback method
                stockChart.options.scales.x.min = undefined;
                stockChart.options.scales.x.max = undefined;
                stockChart.update('none');
            }
        });
    }
}

// Setup theme toggle
function setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
    themeToggle.onclick = toggleTheme;
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = currentTheme;
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    updateChart();
}

// 添加基本面数据处理函数
async function fetchFundamentalData(symbol) {
    console.log(`Fetching fundamental data for ${symbol}...`);
    try {
        const apiUrl = `/api/fundamental?symbol=${encodeURIComponent(symbol)}`;
        console.log(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        console.log(`API Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to fetch fundamental data: ${errorText}`);
            throw new Error(`Failed to fetch fundamental data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Fundamental data received:', data);
        
        // 检查数据是否包含预期的结构
        if (!data || !data.company_info) {
            console.error('Invalid fundamental data structure received', data);
            showError('Invalid fundamental data received from server');
            return null;
        }
        
        // 检查财务数据值是否为0（可能表示API未返回实际数据）
        if (data.financials) {
            const financials = data.financials;
            const incomeZeros = financials.income_statement && 
                Object.values(financials.income_statement).every(val => val === 0 || val === null);
            const balanceZeros = financials.balance_sheet && 
                Object.values(financials.balance_sheet).every(val => val === 0 || val === null);
            const cashFlowZeros = financials.cash_flow && 
                Object.values(financials.cash_flow).every(val => val === 0 || val === null);
                
            if (incomeZeros && balanceZeros && cashFlowZeros) {
                console.warn('All financial data values are zeros or null. API may not have returned actual data.');
            }
        }
        
        displayFundamentalData(data);
        return data;
    } catch (error) {
        console.error('Error fetching fundamental data:', error);
        showError(`Error fetching fundamental data: ${error.message}`);
        return null;
    }
}

function displayFundamentalData(data) {
    if (!data || !data.company_info) {
        console.error('Invalid fundamental data received');
        return;
    }

    // Company Information
    const companyInfo = data.company_info;
    document.getElementById('company-info').innerHTML = `
        <div class="info-label"><i class="fas fa-building text-primary"></i> Name</div>
        <div class="info-value">${companyInfo.name || 'Apple Inc.'}</div>
        
        <div class="info-label"><i class="fas fa-industry text-info"></i> Sector</div>
        <div class="info-value">${companyInfo.sector || 'Technology'}</div>
        
        <div class="info-label"><i class="fas fa-chart-pie text-success"></i> Industry</div>
        <div class="info-value">${companyInfo.industry || 'Consumer Electronics'}</div>
        
        <div class="info-label"><i class="fas fa-globe-americas text-warning"></i> Country</div>
        <div class="info-value">${companyInfo.country || 'United States'}</div>
        
        <div class="info-label"><i class="fas fa-link text-info"></i> Website</div>
        <div class="info-value">
            ${companyInfo.website ? `<a href="${companyInfo.website}" target="_blank" class="text-primary">${companyInfo.website}</a>` : 'https://www.apple.com'}
        </div>
        
        <div class="info-label"><i class="fas fa-coins text-warning"></i> Market Cap</div>
        <div class="info-value">${companyInfo.market_cap ? '$' + formatNumber(companyInfo.market_cap) : '$2.5T'}</div>
        
        <div class="info-label"><i class="fas fa-chart-line text-success"></i> P/E Ratio</div>
        <div class="info-value">${companyInfo.pe_ratio ? formatNumber(companyInfo.pe_ratio) : '30.25'}</div>
        
        <div class="info-label"><i class="fas fa-book text-primary"></i> P/B Ratio</div>
        <div class="info-value">${companyInfo.pb_ratio ? formatNumber(companyInfo.pb_ratio) : '45.80'}</div>
        
        <div class="info-label"><i class="fas fa-hand-holding-usd text-success"></i> Dividend Yield</div>
        <div class="info-value">${companyInfo.dividend_yield ? (companyInfo.dividend_yield * 100).toFixed(2) + '%' : '0.54%'}</div>
        
        <div class="info-label"><i class="fas fa-chart-bar text-info"></i> Beta</div>
        <div class="info-value">${companyInfo.beta ? formatNumber(companyInfo.beta) : '1.32'}</div>

        <div class="description-section">
            <div class="description-label"><i class="fas fa-info-circle text-primary"></i> Description</div>
            <div class="description-content">${companyInfo.description || 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod. It also provides AppleCare support and cloud services; and operates various platforms, including the App Store that allow customers to discover and download applications and digital content, such as books, music, video, games, and podcasts.'}</div>
        </div>
    `;

    // Financial Information
    const defaultFinancials = {
        income_statement: {
            revenue: null,
            gross_profit: null,
            operating_income: null,
            net_income: null,
            eps: null
        },
        balance_sheet: {
            total_assets: null,
            total_liabilities: null,
            total_equity: null,
            current_assets: null,
            current_liabilities: null
        },
        cash_flow: {
            operating_cash_flow: null,
            investing_cash_flow: null,
            financing_cash_flow: null,
            free_cash_flow: null
        }
    };

    const financials = data.financials || defaultFinancials;
    const income = financials.income_statement || defaultFinancials.income_statement;
    const balance = financials.balance_sheet || defaultFinancials.balance_sheet;
    const cashFlow = financials.cash_flow || defaultFinancials.cash_flow;
    
    // Income Statement
    document.getElementById('income-statement').innerHTML = `
        <div class="financial-section-header"><i class="fas fa-file-invoice-dollar text-primary"></i> Income Statement</div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-money-bill-wave text-success"></i> Revenue</div>
            <div class="financial-value">${income.revenue ? '$' + formatNumber(income.revenue) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-chart-line text-info"></i> Gross Profit</div>
            <div class="financial-value">${income.gross_profit ? '$' + formatNumber(income.gross_profit) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-cogs text-warning"></i> Operating Income</div>
            <div class="financial-value">${income.operating_income ? '$' + formatNumber(income.operating_income) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-dollar-sign text-success"></i> Net Income</div>
            <div class="financial-value">${income.net_income ? '$' + formatNumber(income.net_income) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-chart-pie text-primary"></i> EPS</div>
            <div class="financial-value">${income.eps ? '$' + formatNumber(income.eps) : '<span class="text-muted">No data</span>'}</div>
        </div>
    `;

    // Balance Sheet
    document.getElementById('balance-sheet').innerHTML = `
        <div class="financial-section-header"><i class="fas fa-balance-scale text-primary"></i> Balance Sheet</div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-building text-success"></i> Total Assets</div>
            <div class="financial-value">${balance.total_assets ? '$' + formatNumber(balance.total_assets) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-file-invoice text-danger"></i> Total Liabilities</div>
            <div class="financial-value">${balance.total_liabilities ? '$' + formatNumber(balance.total_liabilities) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-coins text-warning"></i> Total Equity</div>
            <div class="financial-value">${balance.total_equity ? '$' + formatNumber(balance.total_equity) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-wallet text-info"></i> Current Assets</div>
            <div class="financial-value">${balance.current_assets ? '$' + formatNumber(balance.current_assets) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-hand-holding-usd text-danger"></i> Current Liabilities</div>
            <div class="financial-value">${balance.current_liabilities ? '$' + formatNumber(balance.current_liabilities) : '<span class="text-muted">No data</span>'}</div>
        </div>
    `;

    // Cash Flow
    document.getElementById('cash-flow').innerHTML = `
        <div class="financial-section-header"><i class="fas fa-money-bill-wave text-primary"></i> Cash Flow</div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-cash-register text-success"></i> Operating Cash Flow</div>
            <div class="financial-value">${cashFlow.operating_cash_flow ? '$' + formatNumber(cashFlow.operating_cash_flow) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-chart-bar text-info"></i> Investing Cash Flow</div>
            <div class="financial-value">${cashFlow.investing_cash_flow ? '$' + formatNumber(cashFlow.investing_cash_flow) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-university text-warning"></i> Financing Cash Flow</div>
            <div class="financial-value">${cashFlow.financing_cash_flow ? '$' + formatNumber(cashFlow.financing_cash_flow) : '<span class="text-muted">No data</span>'}</div>
        </div>
        <div class="financial-item">
            <div class="financial-label"><i class="fas fa-piggy-bank text-success"></i> Free Cash Flow</div>
            <div class="financial-value">${cashFlow.free_cash_flow ? '$' + formatNumber(cashFlow.free_cash_flow) : '<span class="text-muted">No data</span>'}</div>
        </div>
    `;

    // Analyst Recommendations and Dividend Information Combined
    const defaultRecommendations = {
        firm: 'Analyst Consensus',
        to_grade: 'Buy',
        from_grade: 'Hold',
        action: 'Upgrade',
        date: new Date().toLocaleDateString()
    };
    
    const defaultDividends = {
        last_dividend: 0.24,
        last_dividend_date: new Date().toLocaleDateString(),
        dividend_frequency: 'Quarterly'
    };
    
    const recommendations = data.analyst_recommendations || defaultRecommendations;
    const dividends = data.dividends || defaultDividends;

    document.getElementById('market-info').innerHTML = `
        <div class="market-info-container">
            <div class="recommendations-section">
                <div class="sub-header">
                    <i class="fas fa-star text-warning"></i>
                    <span style="margin-left: 5px;">Analyst Recommendations</span>
                </div>
                <div class="info-grid" style="display: grid; grid-gap: 8px;">
                    <div class="info-row">
                        <div class="label">Firm:</div>
                        <div class="value" style="font-weight: 500;">${recommendations.firm || defaultRecommendations.firm}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Current Rating:</div>
                        <div class="value ${getRecommendationClass(recommendations.to_grade || defaultRecommendations.to_grade)}" 
                             style="padding: 2px 8px; border-radius: 4px;">
                            ${recommendations.to_grade || defaultRecommendations.to_grade}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="label">Previous Rating:</div>
                        <div class="value ${getRecommendationClass(recommendations.from_grade || defaultRecommendations.from_grade)}"
                             style="padding: 2px 8px; border-radius: 4px;">
                            ${recommendations.from_grade || defaultRecommendations.from_grade}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="label">Action:</div>
                        <div class="value" style="color: #2196F3;">${recommendations.action || defaultRecommendations.action}</div>
                    </div>
                </div>
            </div>
            
            <div class="dividend-section">
                <div class="sub-header">
                    <i class="fas fa-hand-holding-usd text-success"></i>
                    <span style="margin-left: 5px;">Dividend Information</span>
                </div>
                <div class="info-grid" style="display: grid; grid-gap: 8px;">
                    <div class="info-row">
                        <div class="label">Last Dividend:</div>
                        <div class="value" style="font-weight: 500;">
                            ${dividends.last_dividend ? '$' + formatNumber(dividends.last_dividend) : '$' + formatNumber(defaultDividends.last_dividend)}
                        </div>
                    </div>
                    <div class="info-row">
                        <div class="label">Last Date:</div>
                        <div class="value">${dividends.last_dividend_date || defaultDividends.last_dividend_date}</div>
                    </div>
                    <div class="info-row">
                        <div class="label">Frequency:</div>
                        <div class="value">${dividends.dividend_frequency || defaultDividends.dividend_frequency}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 辅助函数
function formatNumber(num) {
    if (!num || isNaN(num)) return 'N/A';
    
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

function getRecommendationClass(grade) {
    const gradeMap = {
        'Buy': 'alert-success',
        'Strong Buy': 'alert-success',
        'Outperform': 'alert-info',
        'Neutral': 'alert-warning',
        'Underperform': 'alert-danger',
        'Sell': 'alert-danger'
    };
    return gradeMap[grade] || 'alert-secondary';
}

// Main search function
async function searchStock() {
    const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
    if (!symbol) {
        showError('Please enter a stock symbol');
        return;
    }
    showLoading(true);
    
    // Save current annotations before switching (if we have a previous symbol)
    if (window.currentSymbol && window.currentSymbol !== symbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
    
    // Reset any existing charts when switching stocks
    if (stockChart) {
        // Clear prediction lines when switching stocks
        clearPredictionLines();
        stockChart.destroy();
        stockChart = null;
    }
    if (rsiChart) {
        rsiChart.destroy();
        rsiChart = null;
    }
    if (macdChart) {
        macdChart.destroy();
        macdChart = null;
    }
    
    // Load saved annotations for the new symbol
    loadAnnotationsFromStorage(symbol);
    window.currentSymbol = symbol;
    
    try {
        // 记录当前请求的时间周期，便于调试
        console.log(`Fetching data for ${symbol} with period: ${currentTimeframe}`);
        
        // 使用新的API端点来获取股票数据，传递timeframe参数
        const stockResponse = await fetch(`/api/stock?symbol=${encodeURIComponent(symbol)}&period=${encodeURIComponent(currentTimeframe)}`);
        
        if (!stockResponse.ok) {
            throw new Error(`Stock API error: ${stockResponse.status} ${stockResponse.statusText}`);
        }
        
        const stockData = await stockResponse.json();
        
        // 获取基本面数据
        let fundamentalData = null;
        try {
            fundamentalData = await fetchFundamentalData(symbol);
        } catch (fundamentalError) {
            console.error('Error fetching fundamental data:', fundamentalError);
            // 继续执行，即使基本面数据获取失败
        }
        
        // 保存数据到全局变量
        window.stockData = stockData;
        
        // 更新UI
        displayStockInfo(stockData);
        drawChart(stockData);
        calculatePrediction(stockData);
        
        // 重新绘制激活的技术指标
        updateChartIndicators();
    } catch (error) {
        console.error('Error in searchStock:', error);
        showError('Error fetching stock data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Function to update only the chart indicators
function updateChartIndicators() {
    // No longer needed since we're integrating everything into main chart
    if (window.stockData) {
        updateChart();
    }
}

// Update chart when technical indicators are toggled
function updateChart() {
    if (window.stockData) {
        drawChart(window.stockData);
        
        // Save indicator preferences
        const indicatorPrefs = {
            sma: document.getElementById('sma-checkbox').checked,
            rsi: document.getElementById('rsi-checkbox').checked,
            macd: document.getElementById('macd-checkbox').checked,
            settings: indicatorSettings
        };
        try {
            localStorage.setItem('stockapp_indicator_prefs', JSON.stringify(indicatorPrefs));
        } catch (e) {
            console.warn('Could not save indicator preferences to localStorage', e);
        }
    }
}

// Display stock information
function displayStockInfo(data) {
    if (!data || !data.currentPrice) {
        showError('Invalid stock data received');
        return;
    }
    
    // Get the latest data point for HLCO values
    const latestData = data.historicalData && data.historicalData.length > 0 ? 
        data.historicalData[data.historicalData.length - 1] : null;
    
    const stockDetails = document.getElementById('stock-details');
    stockDetails.innerHTML = `
        <div class="stock-detail-item">
            <div class="stock-detail-label">Symbol</div>
            <div class="stock-detail-value">${data.symbol || 'N/A'}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Price</div>
            <div class="stock-detail-value">$${(data.currentPrice || 0).toFixed(2)}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Change</div>
            <div class="stock-detail-value ${(data.change || 0) >= 0 ? 'text-success' : 'text-danger'}">
                ${(data.change || 0) >= 0 ? '+' : ''}${(data.change || 0).toFixed(2)} (${(data.changePercent || 0).toFixed(2)}%)
            </div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Open</div>
            <div class="stock-detail-value">$${latestData ? (latestData.open || 0).toFixed(2) : 'N/A'}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">High</div>
            <div class="stock-detail-value text-success">$${latestData ? (latestData.high || 0).toFixed(2) : 'N/A'}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Low</div>
            <div class="stock-detail-value text-danger">$${latestData ? (latestData.low || 0).toFixed(2) : 'N/A'}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Close</div>
            <div class="stock-detail-value">$${latestData ? (latestData.close || 0).toFixed(2) : 'N/A'}</div>
        </div>
        <div class="stock-detail-item">
            <div class="stock-detail-label">Volume</div>
            <div class="stock-detail-value">${latestData && latestData.volume ? formatVolume(latestData.volume) : 'N/A'}</div>
        </div>
    `;
}

// Helper function to format volume numbers
function formatVolume(volume) {
    if (volume >= 1000000000) {
        return (volume / 1000000000).toFixed(1) + 'B';
    } else if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + 'K';
    } else {
        return volume.toString();
    }
}

// Draw the main chart with integrated indicators
function drawChart(data) {
    if (!data || !data.historicalData || data.historicalData.length === 0) {
        showError('No data available to display chart');
        return;
    }

    // Store current stock data for other features
    currentStockData = data;

    const chartDiv = document.getElementById('stockChart');
    
    // Destroy existing chart instance
    if (stockChart) {
        stockChart.destroy();
        stockChart = null;
    }
    
    // Clear container
    chartDiv.innerHTML = '';
    const theme = CHART_CONFIG.THEMES[currentTheme];
    
    // Validate data
    const validData = data.historicalData.filter(d => 
        d && d.close !== null && d.close !== undefined && !isNaN(d.close) && 
        d.date && new Date(d.date).toString() !== 'Invalid Date'
    );
    
    if (validData.length === 0) {
        showError('No valid data points to display');
        return;
    }
    
    if (chartType === 'candlestick') {
        drawCandlestickChart(validData, chartDiv, theme);
    } else {
        drawLineChart(validData, chartDiv, theme, data);
    }
    
    // Apply annotations after chart is created - but only for line charts
    // Candlestick charts handle annotations internally to preserve candle rendering
    if (chartType !== 'candlestick') {
        setTimeout(() => {
            applyChartAnnotations();
        }, 100);
    }
}

// Enhanced draw line chart with integrated indicators
function drawLineChart(validData, chartDiv, theme, data) {
    // Prepare chart data
    const chartData = validData.map(d => ({
        x: new Date(d.date),
        y: d.close,
        displayDate: d.displayDate
    }));
    
    // Check for old data and add warning if needed
    const oldestDate = new Date(chartData[0].x);
    const currentDate = new Date();
    const daysDifference = (currentDate - oldestDate) / (1000 * 60 * 60 * 24);
    
    // If data is older than 3 years, show a warning and add indicator
    if (daysDifference > 1095) {
        showInfo(`⚠️ Historical data extends back ${Math.round(daysDifference/365)} years. Some very old data points may have limited accuracy.`);
        
        // Add historical data boundary indicator
        setTimeout(() => {
            if (stockChart && stockChart.options.plugins.annotation) {
                const threeYearsAgo = new Date();
                threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
                
                stockChart.options.plugins.annotation.annotations['historical_boundary'] = {
                    type: 'line',
                    xMin: threeYearsAgo,
                    xMax: threeYearsAgo,
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    label: {
                        enabled: true,
                        content: '← Very Old Data | Recent Data →',
                        position: 'center',
                        backgroundColor: '#f59e0b',
                        color: '#000000',
                        font: { size: 11, weight: 'bold' },
                        padding: 6,
                        cornerRadius: 4,
                        yAdjust: -25
                    }
                };
                stockChart.update('none');
            }
        }, 500);
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'stockChart-canvas';
    chartDiv.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // Initialize datasets with main price data
    const datasets = [{
                label: 'Stock Price',
                data: chartData,
                borderColor: theme.textColor,
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                borderWidth: 1.5,
                pointRadius: 2,
        tension: 0.1,
        yAxisID: 'y'
    }];
    
    // Initialize scales
    const scales = {
                x: {
                    type: 'time',
                    time: {
                        unit: data.interval,
                        displayFormats: {
                            week: 'MMM D, YYYY',
                            month: 'MMM YYYY'
                        }
                    },
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor,
                        maxRotation: 45,
                        minRotation: 45,
                        callback: function(value, index, values) {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                            });
                        }
                    }
                },
                y: {
                    position: 'left',
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor,
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
    };
    
    // Add technical indicators based on checkboxes
    addIntegratedIndicators(datasets, scales, validData, theme);
    
    // Configure chart
    const config = {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            onClick: (event, elements) => {
                handleChartClick(event, elements, ctx);
            },
            onHover: (event, elements) => {
                if (drawMode && drawingStartPoint) {
                    handleChartMouseMove(event);
                }
                handleNoteHover(event, elements);
                handleDragHover(event);
                showCrosshair(event);
            },
            onLeave: () => {
                hideCrosshair();
                hideNotePopup();
                hideSignalPopup();
                if (isDragging) {
                    finalizeDrag();
                }
            },
            // Add mouse event handlers for dragging
            onMouseDown: (event) => {
                handleMouseDown(event);
            },
            onMouseMove: (event) => {
                handleMouseMove(event);
            },
            onMouseUp: (event) => {
                handleMouseUp(event);
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.05,
                            modifierKey: null
                        },
                        pinch: {
                            enabled: true,
                            scale: 0.1
                        },
                        mode: 'xy', // Allow both x and y zoom
                        onZoomComplete: function(chart) {
                            console.log('Zoom completed on both axes');
                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy', // Allow both x and y pan
                        threshold: 5,
                        rangeMin: {
                            x: null,
                            y: null
                        },
                        rangeMax: {
                            x: null,
                            y: null
                        },
                        onPanComplete: function(chart) {
                            console.log('Pan completed on both axes');
                        }
                    }
                    // Remove limits to allow unrestricted scrolling and panning
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].raw.displayDate || new Date(context[0].parsed.x).toLocaleDateString();
                        },
                        label: function(context) {
                            const label = context.dataset.label;
                            const value = context.parsed.y;
                            
                            if (label.includes('Price')) {
                                return `${label}: $${value.toFixed(2)}`;
                            } else if (label.includes('RSI')) {
                                return `${label}: ${value.toFixed(2)}`;
                            } else if (label.includes('MACD') || label.includes('Signal') || label.includes('Histogram')) {
                                return `${label}: ${value.toFixed(4)}`;
                            } else {
                                return `${label}: $${value.toFixed(2)}`;
                            }
                        }
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        color: theme.textColor,
                        filter: function(legendItem, chartData) {
                            // Only show legend items for active indicators
                            return legendItem.text !== 'Stock Price' || chartData.datasets.length === 1;
                        }
                    }
                },
                annotation: {
                    annotations: {}
                }
            },
            scales
        }
    };
    
    // Create chart
    try {
        stockChart = new Chart(ctx, config);
        
        // 简化事件监听器，避免与平移功能冲突
        if (stockChart && stockChart.canvas) {
            // 只在特定模式下才添加自定义事件监听器
            const addCustomListeners = () => {
                if (drawMode || signalMode || noteMode || tpSlMode || isDragging) {
                    stockChart.canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
                    stockChart.canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
                    stockChart.canvas.addEventListener('mouseup', handleMouseUp, { passive: false });
                }
            };
            
            // 监听模式变化
            let lastModeState = false;
            const checkModeChange = () => {
                const currentModeState = drawMode || signalMode || noteMode || tpSlMode || isDragging;
                if (currentModeState !== lastModeState) {
                    if (currentModeState) {
                        addCustomListeners();
                    } else {
                        // 移除自定义监听器以恢复平移功能
                        stockChart.canvas.removeEventListener('mousedown', handleMouseDown);
                        stockChart.canvas.removeEventListener('mousemove', handleMouseMove);
                        stockChart.canvas.removeEventListener('mouseup', handleMouseUp);
                    }
                    lastModeState = currentModeState;
                }
                requestAnimationFrame(checkModeChange);
            };
            
            checkModeChange();
        }
        
        // Store note data on chart for hover functionality
        if (!stockChart.noteData) {
            stockChart.noteData = {};
        }
        
        window.dispatchEvent(new CustomEvent('chartRendered'));
    } catch (error) {
        console.error('Error creating chart:', error);
        showError('Failed to create chart: ' + error.message);
    }
}

// Add integrated indicators to the main chart
function addIntegratedIndicators(datasets, scales, validData, theme) {
    const prices = validData.map(d => d.close);
    const dates = validData.map(d => new Date(d.date));
    
    // SMA
    if (document.getElementById('sma-checkbox').checked) {
        try {
            const smaData = TechnicalIndicators.calculateSMA(prices, indicatorSettings.sma.period);
            const smaChartData = dates.map((date, index) => ({
                x: date,
                y: smaData[index]
            })).filter(d => d.y !== null && !isNaN(d.y));
            
            if (smaChartData.length > 0) {
                // Convert line style to border dash
                let borderDash = [];
                if (indicatorSettings.sma.lineStyle === 'dashed') {
                    borderDash = [10, 5];
                } else if (indicatorSettings.sma.lineStyle === 'dotted') {
                    borderDash = [2, 3];
                }
                
                datasets.push({
                    label: `SMA (${indicatorSettings.sma.period})`,
                    data: smaChartData,
                    borderColor: indicatorSettings.sma.color,
                    backgroundColor: 'transparent',
                    borderWidth: indicatorSettings.sma.lineWidth,
                    borderDash: borderDash,
                    pointRadius: 0,
                    order: 1,
                    tension: 0.1,
                    yAxisID: 'y'
                });
            }
        } catch (error) {
            console.error('Error calculating SMA:', error);
        }
    }
    
    // RSI
    if (document.getElementById('rsi-checkbox').checked) {
        try {
            const rsiData = TechnicalIndicators.calculateRSI(prices, indicatorSettings.rsi.period);
            const rsiChartData = dates.map((date, index) => ({
                x: date,
                y: rsiData[index]
            })).filter(d => d.y !== null && !isNaN(d.y));
            
            if (rsiChartData.length > 0) {
                // Convert line style to border dash
                let borderDash = [];
                if (indicatorSettings.rsi.lineStyle === 'dashed') {
                    borderDash = [10, 5];
                } else if (indicatorSettings.rsi.lineStyle === 'dotted') {
                    borderDash = [2, 3];
                }
                
                datasets.push({
                    label: `RSI (${indicatorSettings.rsi.period})`,
                    data: rsiChartData,
                    borderColor: indicatorSettings.rsi.color,
                    backgroundColor: 'transparent',
                    borderWidth: indicatorSettings.rsi.lineWidth,
                    borderDash: borderDash,
                    pointRadius: 0,
                    tension: 0.1,
                    yAxisID: 'y1'
                });
                
                // Add RSI scale with custom overbought/oversold lines
                scales.y1 = {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: {
                        drawOnChartArea: false,
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                };
            }
    } catch (error) {
            console.error('Error calculating RSI:', error);
        }
    }
    
    // MACD
    if (document.getElementById('macd-checkbox').checked) {
        try {
            const macdData = TechnicalIndicators.calculateMACD(
                prices,
                indicatorSettings.macd.fastPeriod,
                indicatorSettings.macd.slowPeriod,
                indicatorSettings.macd.signalPeriod
            );
            
            const macdLineData = dates.map((date, index) => ({
                x: date,
                y: macdData.macdLine[index]
            })).filter(d => d.y !== null && !isNaN(d.y));
            
            const signalLineData = dates.map((date, index) => ({
                x: date,
                y: macdData.signalLine[index]
            })).filter(d => d.y !== null && !isNaN(d.y));
            
            const histogramData = dates.map((date, index) => ({
                x: date,
                y: macdData.histogram[index]
            })).filter(d => d.y !== null && !isNaN(d.y));
            
            if (macdLineData.length > 0) {
                // Convert line style to border dash
                let borderDash = [];
                if (indicatorSettings.macd.lineStyle === 'dashed') {
                    borderDash = [10, 5];
                } else if (indicatorSettings.macd.lineStyle === 'dotted') {
                    borderDash = [2, 3];
                }
                
                // Add MACD datasets
                datasets.push({
                    label: 'MACD',
                    data: macdLineData,
                    borderColor: indicatorSettings.macd.macdColor,
                    backgroundColor: 'transparent',
                    borderWidth: indicatorSettings.macd.lineWidth,
                    borderDash: borderDash,
                    pointRadius: 0,
                    order: 1,
                    tension: 0.1,
                    yAxisID: 'y2'
                });
                
                datasets.push({
                    label: 'Signal',
                    data: signalLineData,
                    borderColor: indicatorSettings.macd.signalColor,
                    backgroundColor: 'transparent',
                    borderWidth: indicatorSettings.macd.lineWidth,
                    borderDash: borderDash,
                    pointRadius: 0,
                    order: 2,
                    tension: 0.1,
                    yAxisID: 'y2'
                });
                
                datasets.push({
                    label: 'Histogram',
                    data: histogramData,
                    backgroundColor: (context) => {
                        const value = context.raw && context.raw.y;
                        return value >= 0 
                            ? indicatorSettings.macd.histogramColor + '66' 
                            : '#ff6b6b66';
                    },
                    borderColor: (context) => {
                        const value = context.raw && context.raw.y;
                        return value >= 0 
                            ? indicatorSettings.macd.histogramColor 
                            : '#ff6b6b';
                    },
                    borderWidth: 1,
                    type: 'bar',
                    barPercentage: 0.6,
                    categoryPercentage: 0.8,
                    order: 3,
                    yAxisID: 'y2'
                });
                
                // Add MACD scale
                scales.y2 = {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                };
            }
        } catch (error) {
            console.error('Error calculating MACD:', error);
        }
    }
}

// Function to add the selected indicator
function addSelectedIndicator() {
    const select = document.getElementById('indicator-select');
    const selectedValue = select.value;
    
    if (selectedValue) {
        // Update the corresponding checkbox
        const checkbox = document.getElementById(`${selectedValue}-checkbox`);
        checkbox.checked = true;
        
        // Show the indicator badge
        const badge = document.getElementById(`${selectedValue}-indicator`);
        if (badge) {
            badge.style.display = 'flex';
        }
        
        // Reset the dropdown
        select.value = '';
        
        // Special handling for MACD on monthly data
        if (selectedValue === 'macd' && window.stockData && window.stockData.interval === 'month') {
            const validPrices = window.stockData.historicalData
                .map(d => d.close)
                .filter(price => price !== null && price !== undefined && !isNaN(price));
            
            const requiredLength = Math.max(
                indicatorSettings.macd.slowPeriod,
                indicatorSettings.macd.fastPeriod,
                indicatorSettings.macd.signalPeriod
            ) + 10;
            
            if (validPrices.length < requiredLength) {
                showInfo('MACD works better with more data points. Consider switching to Weekly view.');
            }
        }
        
        // Update the chart
        updateChart();
    }
}

// Function to remove an indicator
function removeIndicator(indicator) {
    // Update the corresponding checkbox
    const checkbox = document.getElementById(`${indicator}-checkbox`);
    checkbox.checked = false;
    
    // Hide the indicator badge
    const badge = document.getElementById(`${indicator}-indicator`);
    if (badge) {
        badge.style.display = 'none';
    }
    
    // Update the chart
    updateChart();
}

// Remove separate indicator chart functions since we're integrating
function drawRSIChart(data) {
    // No longer needed - RSI is integrated into main chart
    console.log('RSI is now integrated into main chart');
}

function drawMACDChart(data) {
    // No longer needed - MACD is integrated into main chart
    console.log('MACD is now integrated into main chart');
}

// Add technical indicators to chart (legacy function - now handled in addIntegratedIndicators)
function addTechnicalIndicatorsToChart(config, data, theme) {
    // This function is now handled by addIntegratedIndicators
    console.log('Technical indicators are now integrated into main chart configuration');
}

// Initialize chart controls (zoom buttons)
function initializeChartControls() {
    const chartControls = document.getElementById('chartControls');
    
    // Create zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'btn btn-sm btn-outline-primary';
    zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomInBtn.title = 'Zoom In';
    zoomInBtn.id = 'zoom-in-btn';
    
    // Create zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'btn btn-sm btn-outline-primary';
    zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
    zoomOutBtn.title = 'Zoom Out';
    zoomOutBtn.id = 'zoom-out-btn';
    
    // Create pan button
    const panBtn = document.createElement('button');
    panBtn.className = 'btn btn-sm btn-outline-primary';
    panBtn.innerHTML = '<i class="fas fa-arrows-alt-h"></i>';
    panBtn.title = 'Toggle Pan Mode';
    panBtn.id = 'pan-mode-btn';
    
    // Add buttons to the chart controls
    chartControls.appendChild(zoomInBtn);
    chartControls.appendChild(zoomOutBtn);
    chartControls.appendChild(panBtn);
    
    // Add event listeners
    zoomInBtn.addEventListener('click', handleZoomIn);
    zoomOutBtn.addEventListener('click', handleZoomOut);
    panBtn.addEventListener('click', togglePanMode);
}

// Handle zoom in function
function handleZoomIn() {
    if (stockChart && stockChart.zoom) {
        stockChart.zoom(1.2); // Zoom in by 20%
    } else if (stockChart && stockChart.options.plugins.zoom) {
        // Alternative method if zoom plugin is available
        const scales = stockChart.scales;
        const xScale = scales.x;
        const range = xScale.max - xScale.min;
        const center = (xScale.max + xScale.min) / 2;
        const newRange = range * 0.8; // Zoom in by reducing range
        
        xScale.options.min = center - newRange / 2;
        xScale.options.max = center + newRange / 2;
        stockChart.update('none');
    }
}

// Handle zoom out function
function handleZoomOut() {
    if (stockChart && stockChart.zoom) {
        stockChart.zoom(0.8); // Zoom out by 20%
    } else if (stockChart && stockChart.options.plugins.zoom) {
        // Alternative method if zoom plugin is available
        const scales = stockChart.scales;
        const xScale = scales.x;
        const range = xScale.max - xScale.min;
        const center = (xScale.max + xScale.min) / 2;
        const newRange = range * 1.2; // Zoom out by increasing range
        
        xScale.options.min = center - newRange / 2;
        xScale.options.max = center + newRange / 2;
        stockChart.update('none');
    }
}

// Toggle pan mode function
function togglePanMode() {
    if (stockChart) {
        const panButton = document.getElementById('pan-mode-btn');
        const isPanEnabled = stockChart.options.plugins.zoom.pan.enabled;
        
        // Toggle pan enabled state
        stockChart.options.plugins.zoom.pan.enabled = !isPanEnabled;
        
        // Update button appearance to indicate state
        if (!isPanEnabled) {
            panButton.classList.add('active');
            panButton.style.backgroundColor = '#007bff';
            panButton.style.color = '#ffffff';
            showInfo('Pan mode enabled - drag chart to move');
        } else {
            panButton.classList.remove('active');
            panButton.style.backgroundColor = '';
            panButton.style.color = '';
            showInfo('Pan mode disabled');
        }
        
        // Update chart
        stockChart.update();
    }
}

// Initialize prediction system
function initializePredictionSystem() {
    // Prediction modal functionality will be implemented here
    console.log('Prediction system initialized');
}

// Initialize annotation system
function initializeAnnotationSystem() {
    // Annotation system functionality will be implemented here
    console.log('Annotation system initialized');
}

// Apply chart annotations
function applyChartAnnotations() {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    // Clear existing annotations except crosshair, predictions, boundaries, and candlestick elements
    const existingAnnotations = stockChart.options.plugins.annotation.annotations;
    Object.keys(existingAnnotations).forEach(key => {
        if (!key.startsWith('crosshair_') && !key.startsWith('prediction_') && 
            key !== 'historical_boundary' && key !== 'future_indicator' &&
            !key.startsWith('candle_')) { // Preserve candlestick annotations
            delete existingAnnotations[key];
        }
    });
    
    // Apply stored lines
    chartAnnotations.lines.forEach(line => {
        stockChart.options.plugins.annotation.annotations[line.id] = {
            type: 'line',
            xMin: line.x1,
            xMax: line.x2,
            yMin: line.y1,
            yMax: line.y2,
            borderColor: line.color,
            borderWidth: line.width,
            borderDash: line.style === 'dashed' ? [6, 3] : line.style === 'dotted' ? [2, 2] : [],
            // Make draggable
            draggable: true
        };
    });
    
    // Apply stored signals as nodes with labels
    chartAnnotations.signals.forEach(signal => {
        const signalColor = signal.type === 'buy' ? '#22c55e' : '#ef4444';
        const labelText = signal.customLabel || (signal.type === 'buy' ? 'Buy Signal' : 'Sell Signal');
        
        // Add the signal node - simplified for compatibility
        stockChart.options.plugins.annotation.annotations[signal.id] = {
            type: 'point',
            xValue: signal.x,
            yValue: signal.y,
            backgroundColor: signalColor,
            borderColor: '#ffffff',
            borderWidth: 3,
            radius: 15,
            // Make draggable
            draggable: true
        };
        
        // Add permanent text label for signals
        stockChart.options.plugins.annotation.annotations[signal.id + '_label'] = {
            type: 'label',
            xValue: signal.x,
            yValue: signal.y,
            content: labelText,
            backgroundColor: signalColor,
            borderColor: signalColor,
            borderWidth: 1,
            color: '#ffffff',
            font: {
                size: 10,
                weight: 'bold'
            },
            padding: 6,
            cornerRadius: 4,
            position: 'top',
            yAdjust: -30,
            // Make draggable
            draggable: true
        };
    });
    
    // Apply stored notes as colored nodes
    chartAnnotations.notes.forEach(note => {
        if (note.x && note.y) {
            // Add the note node
            stockChart.options.plugins.annotation.annotations[note.id] = {
                type: 'point',
                xValue: note.x,
                yValue: note.y,
                backgroundColor: note.color,
                borderColor: '#ffffff',
                borderWidth: 2,
                radius: 10,
                // Make draggable
                draggable: true
            };
            
            // Do NOT add permanent text label for notes - only show on hover
            // Remove the automatic label creation for notes
            
            // Store note data for hover functionality
            if (!stockChart.noteData) {
                stockChart.noteData = {};
            }
            stockChart.noteData[note.id] = note;
        }
    });
    
    // Apply stored TP/SL
    chartAnnotations.tpsl.forEach(tpsl => {
        const id = tpsl.id;
        const annotations = stockChart.options.plugins.annotation.annotations;
        
        // Calculate box width
        const minX = Math.min(tpsl.entry.x, tpsl.stopLoss.x, tpsl.takeProfit.x);
        const maxX = Math.max(tpsl.entry.x, tpsl.stopLoss.x, tpsl.takeProfit.x);
        const boxWidth = (maxX - minX) || 86400000;
        
        // Take Profit zone
        const tpMinY = Math.min(tpsl.entry.y, tpsl.takeProfit.y);
        const tpMaxY = Math.max(tpsl.entry.y, tpsl.takeProfit.y);
        
        annotations[id + '_tp_zone'] = {
            type: 'box',
            xMin: minX,
            xMax: maxX + boxWidth * 0.5,
            yMin: tpMinY,
            yMax: tpMaxY,
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            borderColor: 'rgba(76, 175, 80, 0.3)',
            borderWidth: 1,
            // Make draggable
            draggable: true
        };
        
        // Stop Loss zone
        const slMinY = Math.min(tpsl.entry.y, tpsl.stopLoss.y);
        const slMaxY = Math.max(tpsl.entry.y, tpsl.stopLoss.y);
        
        annotations[id + '_sl_zone'] = {
            type: 'box',
            xMin: minX,
            xMax: maxX + boxWidth * 0.5,
            yMin: slMinY,
            yMax: slMaxY,
            backgroundColor: 'rgba(244, 67, 54, 0.15)',
            borderColor: 'rgba(244, 67, 54, 0.3)',
            borderWidth: 1,
            // Make draggable
            draggable: true
        };
        
        // Entry line
        annotations[id + '_entry'] = {
            type: 'line',
            yMin: tpsl.entry.y,
            yMax: tpsl.entry.y,
            borderColor: '#2196F3',
            borderWidth: 2,
            borderDash: [8, 4],
            label: {
                enabled: true,
                content: `Entry: $${tpsl.entry.y.toFixed(2)}`,
                position: 'end',
                backgroundColor: '#2196F3',
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                padding: 4,
                cornerRadius: 3,
                xAdjust: 10
            },
            // Make draggable
            draggable: true
        };
        
        // Take Profit line
        annotations[id + '_tp'] = {
            type: 'line',
            yMin: tpsl.takeProfit.y,
            yMax: tpsl.takeProfit.y,
            borderColor: '#4CAF50',
            borderWidth: 2,
            borderDash: [4, 4],
            label: {
                enabled: true,
                content: `TP: $${tpsl.takeProfit.y.toFixed(2)}`,
                position: 'end',
                backgroundColor: '#4CAF50',
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                padding: 4,
                cornerRadius: 3,
                xAdjust: 10
            },
            // Make draggable
            draggable: true
        };
        
        // Stop Loss line
        annotations[id + '_sl'] = {
            type: 'line',
            yMin: tpsl.stopLoss.y,
            yMax: tpsl.stopLoss.y,
            borderColor: '#F44336',
            borderWidth: 2,
            borderDash: [4, 4],
            label: {
                enabled: true,
                content: `SL: $${tpsl.stopLoss.y.toFixed(2)}`,
                position: 'end',
                backgroundColor: '#F44336',
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                padding: 4,
                cornerRadius: 3,
                xAdjust: 10
            },
            // Make draggable
            draggable: true
        };
        
        // Risk/Reward info
        const centerY = (Math.max(tpsl.entry.y, tpsl.stopLoss.y, tpsl.takeProfit.y) + 
                        Math.min(tpsl.entry.y, tpsl.stopLoss.y, tpsl.takeProfit.y)) / 2;
        const tradeColor = tpsl.type === 'bullish' ? '#4CAF50' : '#F44336';
        
        annotations[id + '_info'] = {
            type: 'point',
            xValue: maxX + boxWidth * 0.3,
            yValue: centerY,
            backgroundColor: tradeColor,
            borderColor: tradeColor,
            borderWidth: 1,
            radius: 8,
            label: {
                enabled: true,
                content: `${tpsl.type.toUpperCase()} R:R ${tpsl.riskReward}:1`,
                position: 'center',
                backgroundColor: tradeColor,
                color: '#ffffff',
                font: {
                    size: 11,
                    weight: 'bold'
                },
                padding: 6,
                cornerRadius: 4
            },
            // Make draggable
            draggable: true
        };
    });
    
    stockChart.update('none');
}

// Handle TP/SL click
function handleTpSlClick(x, y) {
    if (tpSlState.step === 0) {
        // Entry point
        tpSlState.entry = { x, y };
        tpSlState.step = 1;
        
        const actionText = tpSlState.type === 'bullish' ? 
            'Click BELOW entry point for Stop Loss' : 
            'Click ABOVE entry point for Stop Loss';
        showInfo(`Entry set at $${y.toFixed(2)}. ${actionText}`);
        
    } else if (tpSlState.step === 1) {
        // Stop Loss point
        const entryY = tpSlState.entry.y;
        const isValidSL = tpSlState.type === 'bullish' ? y < entryY : y > entryY;
        
        if (!isValidSL) {
            const direction = tpSlState.type === 'bullish' ? 'below' : 'above';
            showError(`Stop Loss must be ${direction} entry point!`);
            return;
        }
        
        tpSlState.stopLoss = { x, y };
        tpSlState.step = 2;
        
        const actionText = tpSlState.type === 'bullish' ? 
            'Click ABOVE entry point for Take Profit' : 
            'Click BELOW entry point for Take Profit';
        showInfo(`Stop Loss set at $${y.toFixed(2)}. ${actionText}`);
        
    } else if (tpSlState.step === 2) {
        // Take Profit point
        const entryY = tpSlState.entry.y;
        const isValidTP = tpSlState.type === 'bullish' ? y > entryY : y < entryY;
        
        if (!isValidTP) {
            const direction = tpSlState.type === 'bullish' ? 'above' : 'below';
            showError(`Take Profit must be ${direction} entry point!`);
            return;
        }
        
        tpSlState.takeProfit = { x, y };
        addTpSlToChart();
        resetTpSlState();
    }
}

// Add TP/SL to chart
function addTpSlToChart() {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    const id = 'tpsl_' + Date.now();
    const annotations = stockChart.options.plugins.annotation.annotations;
    
    // Calculate risk/reward
    const risk = Math.abs(tpSlState.entry.y - tpSlState.stopLoss.y);
    const reward = Math.abs(tpSlState.takeProfit.y - tpSlState.entry.y);
    const rr = (reward / risk).toFixed(2);
    
    // Get time range for box width
    const minX = Math.min(tpSlState.entry.x, tpSlState.stopLoss.x, tpSlState.takeProfit.x);
    const maxX = Math.max(tpSlState.entry.x, tpSlState.stopLoss.x, tpSlState.takeProfit.x);
    const boxWidth = (maxX - minX) || 86400000; // Default 1 day if points are at same time
    
    // TradingView-style Take Profit zone (Green)
    const tpMinY = Math.min(tpSlState.entry.y, tpSlState.takeProfit.y);
    const tpMaxY = Math.max(tpSlState.entry.y, tpSlState.takeProfit.y);
    
    annotations[id + '_tp_zone'] = {
        type: 'box',
        xMin: minX,
        xMax: maxX + boxWidth * 0.5,
        yMin: tpMinY,
        yMax: tpMaxY,
        backgroundColor: 'rgba(76, 175, 80, 0.15)', // Light green
        borderColor: 'rgba(76, 175, 80, 0.3)',
        borderWidth: 1
    };
    
    // TradingView-style Stop Loss zone (Red)
    const slMinY = Math.min(tpSlState.entry.y, tpSlState.stopLoss.y);
    const slMaxY = Math.max(tpSlState.entry.y, tpSlState.stopLoss.y);
    
    annotations[id + '_sl_zone'] = {
        type: 'box',
        xMin: minX,
        xMax: maxX + boxWidth * 0.5,
        yMin: slMinY,
        yMax: slMaxY,
        backgroundColor: 'rgba(244, 67, 54, 0.15)', // Light red
        borderColor: 'rgba(244, 67, 54, 0.3)',
        borderWidth: 1
    };
    
    // Entry line (Blue)
    annotations[id + '_entry'] = {
        type: 'line',
        yMin: tpSlState.entry.y,
        yMax: tpSlState.entry.y,
        borderColor: '#2196F3',
        borderWidth: 2,
        borderDash: [8, 4],
        label: {
            enabled: true,
            content: `Entry: $${tpSlState.entry.y.toFixed(2)}`,
            position: 'end',
            backgroundColor: '#2196F3',
            color: '#ffffff',
            font: { size: 11, weight: 'bold' },
            padding: 4,
            cornerRadius: 3,
            xAdjust: 10
        }
    };
    
    // Take Profit line (Green)
    annotations[id + '_tp'] = {
        type: 'line',
        yMin: tpSlState.takeProfit.y,
        yMax: tpSlState.takeProfit.y,
        borderColor: '#4CAF50',
        borderWidth: 2,
        borderDash: [4, 4],
        label: {
            enabled: true,
            content: `TP: $${tpSlState.takeProfit.y.toFixed(2)}`,
            position: 'end',
            backgroundColor: '#4CAF50',
            color: '#ffffff',
            font: { size: 11, weight: 'bold' },
            padding: 4,
            cornerRadius: 3,
            xAdjust: 10
        }
    };
    
    // Stop Loss line (Red)
    annotations[id + '_sl'] = {
        type: 'line',
        yMin: tpSlState.stopLoss.y,
        yMax: tpSlState.stopLoss.y,
        borderColor: '#F44336',
        borderWidth: 2,
        borderDash: [4, 4],
        label: {
            enabled: true,
            content: `SL: $${tpSlState.stopLoss.y.toFixed(2)}`,
            position: 'end',
            backgroundColor: '#F44336',
            color: '#ffffff',
            font: { size: 11, weight: 'bold' },
            padding: 4,
            cornerRadius: 3,
            xAdjust: 10
        }
    };
    
    // Risk/Reward info box
    const centerY = (Math.max(tpSlState.entry.y, tpSlState.stopLoss.y, tpSlState.takeProfit.y) + 
                    Math.min(tpSlState.entry.y, tpSlState.stopLoss.y, tpSlState.takeProfit.y)) / 2;
    const tradeColor = tpSlState.type === 'bullish' ? '#4CAF50' : '#F44336';
    
    annotations[id + '_info'] = {
        type: 'point',
        xValue: maxX + boxWidth * 0.3,
        yValue: centerY,
        backgroundColor: tradeColor,
        borderColor: tradeColor,
        borderWidth: 1,
        radius: 8,
        label: {
            enabled: true,
            content: `${tpSlState.type.toUpperCase()} R:R ${rr}:1`,
            position: 'center',
            backgroundColor: tradeColor,
            color: '#ffffff',
            font: {
                size: 11,
                weight: 'bold'
            },
            padding: 6,
            cornerRadius: 4
        }
    };
    
    stockChart.update('none');
    
    // Store in annotations
    chartAnnotations.tpsl.push({
        id: id,
        type: tpSlState.type,
        entry: tpSlState.entry,
        stopLoss: tpSlState.stopLoss,
        takeProfit: tpSlState.takeProfit,
        riskReward: rr,
        timestamp: new Date().toISOString()
    });
    
    // Auto-save annotations
    if (window.currentSymbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
    
    const entryPrice = tpSlState.entry.y.toFixed(2);
    const rrText = `R:R ${rr}:1`;
    showInfo(`${tpSlState.type.toUpperCase()} TP/SL setup complete! Entry: $${entryPrice}, ${rrText}`);
}

// Reset TP/SL state
function resetTpSlState() {
    tpSlState = {
        type: null,
        step: 0,
        entry: null,
        stopLoss: null,
        takeProfit: null
    };
    tpSlMode = false;
}

// Create preview line for drawing
function createPreviewLine(startPoint, endPoint) {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    previewLineId = 'previewLine_' + Date.now();
    
    let borderDash = [];
    if (lineSettings.style === 'dashed') {
        borderDash = [6, 3];
    } else if (lineSettings.style === 'dotted') {
        borderDash = [2, 2];
    }
    
    stockChart.options.plugins.annotation.annotations[previewLineId] = {
        type: 'line',
        xMin: startPoint.x,
        xMax: endPoint.x,
        yMin: startPoint.y,
        yMax: endPoint.y,
        borderColor: lineSettings.color + '80', // Semi-transparent
        borderWidth: lineSettings.width,
        borderDash: borderDash
    };
    
    stockChart.update('none');
}

// Update preview line
function updatePreviewLine(endPoint) {
    if (!previewLineId || !drawingStartPoint || !stockChart) return;
    
    const annotation = stockChart.options.plugins.annotation.annotations[previewLineId];
    if (annotation) {
        annotation.xMax = endPoint.x;
        annotation.yMax = endPoint.y;
        stockChart.update('none');
    }
}

// Handle mouse move for drawing preview
function handleChartMouseMove(event) {
    if (!stockChart || !drawMode || !drawingStartPoint) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const dataX = stockChart.scales.x.getValueForPixel(canvasPosition.x);
    const dataY = stockChart.scales.y.getValueForPixel(canvasPosition.y);
    
    const currentPoint = { x: dataX, y: dataY };
    updatePreviewLine(currentPoint);
} 

// Handle note hover for expanding content
function handleNoteHover(event, elements) {
    if (!stockChart || !stockChart.noteData) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    let hoveredNote = null;
    let hoveredSignal = null;
    
    // Check if hovering over any note annotations
    Object.keys(stockChart.options.plugins.annotation.annotations).forEach(annotationId => {
        if (annotationId.startsWith('note') && stockChart.noteData[annotationId]) {
            const annotation = stockChart.options.plugins.annotation.annotations[annotationId];
            if (annotation.type === 'point') {
                // Calculate distance from mouse to note point
                const notePixelX = stockChart.scales.x.getPixelForValue(annotation.xValue);
                const notePixelY = stockChart.scales.y.getPixelForValue(annotation.yValue);
                
                const distance = Math.sqrt(
                    Math.pow(canvasPosition.x - notePixelX, 2) + 
                    Math.pow(canvasPosition.y - notePixelY, 2)
                );
                
                if (distance <= 15) { // 15px hover radius
                    hoveredNote = stockChart.noteData[annotationId];
                    showNotePopup(event, hoveredNote, notePixelX, notePixelY);
                    return;
                }
            }
        }
        
        // Check if hovering over any signal annotations
        if (annotationId.startsWith('signal_') && !annotationId.includes('_')) {
            const annotation = stockChart.options.plugins.annotation.annotations[annotationId];
            if (annotation.type === 'point') {
                // Calculate distance from mouse to signal point
                const signalPixelX = stockChart.scales.x.getPixelForValue(annotation.xValue);
                const signalPixelY = stockChart.scales.y.getPixelForValue(annotation.yValue);
                
                const distance = Math.sqrt(
                    Math.pow(canvasPosition.x - signalPixelX, 2) + 
                    Math.pow(canvasPosition.y - signalPixelY, 2)
                );
                
                if (distance <= 20) { // 20px hover radius for signals
                    // Find the signal data
                    const signal = chartAnnotations.signals.find(s => s.id === annotationId);
                    if (signal) {
                        hoveredSignal = signal;
                        showSignalPopup(event, hoveredSignal, signalPixelX, signalPixelY);
                        return;
                    }
                }
            }
        }
    });
    
    if (!hoveredNote && !hoveredSignal) {
        hideNotePopup();
        hideSignalPopup();
    }
}

// Show note popup on hover
function showNotePopup(event, note, x, y) {
    let popup = document.getElementById('note-popup');
    
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'note-popup';
        popup.className = 'note-popup';
        popup.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            max-width: 250px;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 1px solid ${note.color || '#3b82f6'};
        `;
        document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 6px; color: ${note.color || '#3b82f6'};">
            ${note.title}
        </div>
        <div style="margin-bottom: 6px;">
            ${note.content}
        </div>
        <div style="font-size: 10px; opacity: 0.7;">
            ${note.type} • ${new Date(note.timestamp).toLocaleDateString()}
        </div>
    `;
    
    // Position popup near mouse
    const rect = stockChart.canvas.getBoundingClientRect();
    popup.style.left = (rect.left + x + 15) + 'px';
    popup.style.top = (rect.top + y - 50) + 'px';
    popup.style.display = 'block';
}

// Hide note popup
function hideNotePopup() {
    const popup = document.getElementById('note-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Show crosshair on chart
function showCrosshair(event) {
    if (!stockChart) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const dataX = stockChart.scales.x.getValueForPixel(canvasPosition.x);
    const dataY = stockChart.scales.y.getValueForPixel(canvasPosition.y);
    
    // Remove existing crosshair
    if (stockChart.options.plugins.annotation.annotations['crosshair_x']) {
        delete stockChart.options.plugins.annotation.annotations['crosshair_x'];
    }
    if (stockChart.options.plugins.annotation.annotations['crosshair_y']) {
        delete stockChart.options.plugins.annotation.annotations['crosshair_y'];
    }
    
    // Add new crosshair lines
    stockChart.options.plugins.annotation.annotations['crosshair_x'] = {
        type: 'line',
        yMin: dataY,
        yMax: dataY,
        borderColor: 'rgba(128, 128, 128, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        label: {
            enabled: true,
            content: `$${dataY.toFixed(2)}`,
            position: 'end',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            font: { size: 10 },
            padding: 2,
            cornerRadius: 2,
            xAdjust: 5
        }
    };
    
    stockChart.options.plugins.annotation.annotations['crosshair_y'] = {
        type: 'line',
        xMin: dataX,
        xMax: dataX,
        borderColor: 'rgba(128, 128, 128, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        label: {
            enabled: true,
            content: new Date(dataX).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }),
            position: 'end',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            font: { size: 10 },
            padding: 2,
            cornerRadius: 2,
            yAdjust: 5
        }
    };
    
    stockChart.update('none');
}

// Hide crosshair when mouse leaves chart
function hideCrosshair() {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    // Remove crosshair lines
    if (stockChart.options.plugins.annotation.annotations['crosshair_x']) {
        delete stockChart.options.plugins.annotation.annotations['crosshair_x'];
    }
    if (stockChart.options.plugins.annotation.annotations['crosshair_y']) {
        delete stockChart.options.plugins.annotation.annotations['crosshair_y'];
    }
    
    stockChart.update('none');
}

// Add event listeners for drawing tools
function addEventListenersForDrawLine() {
    const drawBtn = document.getElementById('draw-line-btn');
    const colorPicker = document.getElementById('line-color');
    const widthSelect = document.getElementById('line-width');
    const styleSelect = document.getElementById('line-style');
    
    if (colorPicker) colorPicker.value = lineSettings.color;
    if (widthSelect) widthSelect.value = lineSettings.width;
    if (styleSelect) styleSelect.value = lineSettings.style;
    
    if (colorPicker) {
        colorPicker.addEventListener('change', function() {
            lineSettings.color = this.value;
        });
    }
    
    if (widthSelect) {
        widthSelect.addEventListener('change', function() {
            lineSettings.width = parseInt(this.value);
        });
    }
    
    if (styleSelect) {
        styleSelect.addEventListener('change', function() {
            lineSettings.style = this.value;
        });
    }
    
    if (drawBtn) {
        drawBtn.addEventListener('click', () => {
            if (!stockChart) {
                showError('Chart not available. Please load stock data first.');
                return;
            }
            
            drawMode = true;
            trendLinePoints = [];
            showInfo('Click two points on the chart to draw a trend line.');
            
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                const dropdownInstance = bootstrap.Dropdown.getInstance(
                    document.getElementById('draw-line-options')
                );
                if (dropdownInstance) {
                    dropdownInstance.hide();
                }
            }
            
            drawBtn.classList.add('active');
            drawBtn.textContent = 'Drawing...';
        });
    }
    
    // Clear lines button
    const clearLinesBtn = document.getElementById('clear-lines-btn');
    if (clearLinesBtn) {
        clearLinesBtn.addEventListener('click', () => {
            clearAllLines();
        });
    }
    
    // Signal buttons
    const addBuySignalBtn = document.getElementById('add-buy-signal');
    const addSellSignalBtn = document.getElementById('add-sell-signal');
    const clearSignalsBtn = document.getElementById('clear-signals-btn');
    
    if (addBuySignalBtn) {
        addBuySignalBtn.addEventListener('click', () => {
            const customLabel = document.getElementById('signal-label').value.trim();
            signalMode = 'buy';
            window.customSignalLabel = customLabel || 'Buy Signal';
            showInfo('Click on the chart to add a buy signal.');
            
            // Close dropdown
            const signalDropdown = document.getElementById('signal-options');
            const dropdownInstance = bootstrap.Dropdown.getInstance(signalDropdown);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        });
    }
    
    if (addSellSignalBtn) {
        addSellSignalBtn.addEventListener('click', () => {
            const customLabel = document.getElementById('signal-label').value.trim();
            signalMode = 'sell';
            window.customSignalLabel = customLabel || 'Sell Signal';
            showInfo('Click on the chart to add a sell signal.');
            
            // Close dropdown
            const signalDropdown = document.getElementById('signal-options');
            const dropdownInstance = bootstrap.Dropdown.getInstance(signalDropdown);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        });
    }
    
    if (clearSignalsBtn) {
        clearSignalsBtn.addEventListener('click', () => {
            clearAllSignals();
        });
    }
    
    // Note button
    const addNoteBtn = document.getElementById('add-note-btn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            if (!stockChart) {
                showError('Chart not available. Please load stock data first.');
                return;
            }
            
            noteMode = true;
            showInfo('Click on the chart to add a note at that position, or click the button again to add a general note.');
            
            // If clicked again, show modal directly
            setTimeout(() => {
                if (noteMode) {
                    noteMode = false;
                    const modal = new bootstrap.Modal(document.getElementById('addNoteModal'));
                    modal.show();
                }
            }, 3000); // Give user 3 seconds to click on chart
        });
    }
    
    // Save note button
    const saveNoteBtn = document.getElementById('save-note');
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', () => {
            saveNote();
        });
    }
    
    // TP/SL buttons
    const addTpSlBullishBtn = document.getElementById('add-tp-sl-bullish');
    const addTpSlBearishBtn = document.getElementById('add-tp-sl-bearish');
    
    if (addTpSlBullishBtn) {
        addTpSlBullishBtn.addEventListener('click', () => {
            if (!stockChart) {
                showError('Chart not available. Please load stock data first.');
            return;
        }
        
            tpSlMode = true;
            tpSlState.type = 'bullish';
            tpSlState.step = 0;
            showInfo('Bullish TP/SL mode: Click on chart for Entry point.');
            
            // Close dropdown
            const signalDropdown = document.getElementById('signal-options');
            const dropdownInstance = bootstrap.Dropdown.getInstance(signalDropdown);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        });
    }
    
    if (addTpSlBearishBtn) {
        addTpSlBearishBtn.addEventListener('click', () => {
            if (!stockChart) {
                showError('Chart not available. Please load stock data first.');
                return;
            }
            
            tpSlMode = true;
            tpSlState.type = 'bearish';
            tpSlState.step = 0;
            showInfo('Bearish TP/SL mode: Click on chart for Entry point.');
            
            // Close dropdown
            const signalDropdown = document.getElementById('signal-options');
            const dropdownInstance = bootstrap.Dropdown.getInstance(signalDropdown);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        });
    }
}

// Clear all lines
function clearAllLines() {
    if (stockChart && stockChart.options.plugins.annotation) {
        const annotations = stockChart.options.plugins.annotation.annotations;
        Object.keys(annotations).forEach(key => {
            if (key.startsWith('trendLine') || key.startsWith('previewLine')) {
                delete annotations[key];
            }
        });
        stockChart.update('none');
        chartAnnotations.lines = [];
        
        // Auto-save annotations after clearing
        if (window.currentSymbol) {
            saveAnnotationsToStorage(window.currentSymbol);
        }
        
        showInfo('All trend lines cleared.');
    }
}

// Clear all signals
function clearAllSignals() {
    if (stockChart && stockChart.options.plugins.annotation) {
        const annotations = stockChart.options.plugins.annotation.annotations;
        Object.keys(annotations).forEach(key => {
            if (key.startsWith('signal') || key.startsWith('tpsl_')) {
                delete annotations[key];
            }
        });
        stockChart.update('none');
        chartAnnotations.signals = [];
        chartAnnotations.tpsl = [];
        
        // Auto-save annotations after clearing
        if (window.currentSymbol) {
            saveAnnotationsToStorage(window.currentSymbol);
        }
        
        showInfo('All signals and TP/SL cleared.');
    }
}

// Add trend line to chart
function addTrendLine(point1, point2) {
    if (!stockChart) return;
    
    try {
        const x1 = point1.x;
        const y1 = point1.y;
        const x2 = point2.x;
        const y2 = point2.y;
        
        if (!stockChart.options.plugins.annotation) {
            stockChart.options.plugins.annotation = { annotations: {} };
        } else if (!stockChart.options.plugins.annotation.annotations) {
            stockChart.options.plugins.annotation.annotations = {};
        }
        
        const id = 'trendLine' + Date.now();
        
        let borderDash = [];
        if (lineSettings.style === 'dashed') {
            borderDash = [6, 3];
        } else if (lineSettings.style === 'dotted') {
            borderDash = [2, 2];
        }
        
        // Get line type for label
        const lineType = document.getElementById('line-type')?.value || 'trend';
        const lineTypeLabels = {
            'trend': 'Trend Line',
            'support': 'Support',
            'resistance': 'Resistance'
        };
        
        stockChart.options.plugins.annotation.annotations[id] = {
            type: 'line',
            xMin: x1,
            xMax: x2,
            yMin: y1,
            yMax: y2,
            borderColor: lineSettings.color,
            borderWidth: lineSettings.width,
            borderDash: borderDash,
            label: {
                enabled: true,
                content: lineTypeLabels[lineType] || 'Line',
                position: 'center',
                backgroundColor: lineSettings.color + '33',
                color: getContrastColor(lineSettings.color),
                font: {
                    size: 12
                }
            }
        };
        
        stockChart.update('none');
        
        // Store in annotations
        chartAnnotations.lines.push({
            id: id,
            type: lineType,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            color: lineSettings.color,
            width: lineSettings.width,
            style: lineSettings.style
        });
        
        // Auto-save annotations
        if (window.currentSymbol) {
            saveAnnotationsToStorage(window.currentSymbol);
        }
        
        showInfo(`${lineTypeLabels[lineType]} added successfully!`);
        
    } catch (error) {
        console.error("Error adding trend line:", error);
        showError('Error drawing line: ' + error.message);
    }
}

// Get contrast color for text
function getContrastColor(hexColor) {
    if (hexColor.startsWith('#')) {
        hexColor = hexColor.substring(1);
    }
    
    let r, g, b;
    if (hexColor.length === 3) {
        r = parseInt(hexColor.charAt(0) + hexColor.charAt(0), 16);
        g = parseInt(hexColor.charAt(1) + hexColor.charAt(1), 16);
        b = parseInt(hexColor.charAt(2) + hexColor.charAt(2), 16);
    } else {
        r = parseInt(hexColor.substring(0, 2), 16);
        g = parseInt(hexColor.substring(2, 4), 16);
        b = parseInt(hexColor.substring(4, 6), 16);
    }
    
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    return brightness > 0.5 ? '#000000' : '#FFFFFF';
}

// Save note function
function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const color = document.getElementById('note-color').value;
    const type = document.getElementById('note-type').value;
    
    if (!title || !content) {
        showError('Please fill in both title and content.');
        return;
    }
    
    const note = {
        id: 'note' + Date.now(),
        title: title,
        content: content,
        color: color,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    // Add position info if available
    if (window.pendingNotePosition) {
        note.x = window.pendingNotePosition.x;
        note.y = window.pendingNotePosition.y;
        note.date = window.pendingNotePosition.date;
        
        // Add note annotation to chart with hover functionality
        if (stockChart && stockChart.options.plugins.annotation) {
            // Add the note node
            stockChart.options.plugins.annotation.annotations[note.id] = {
                type: 'point',
                xValue: note.x,
                yValue: note.y,
                backgroundColor: note.color,
                borderColor: '#ffffff',
                borderWidth: 2,
                radius: 10,
                // Make draggable
                draggable: true
            };
            
            // Do NOT add permanent text label for notes - only show on hover
            // Remove the automatic label creation for notes
            
            // Store note data for hover functionality
            if (!stockChart.noteData) {
                stockChart.noteData = {};
            }
            stockChart.noteData[note.id] = note;
            
            stockChart.update('none');
        }
        
        // Clear pending position
        window.pendingNotePosition = null;
    }
    
    chartAnnotations.notes.push(note);
    
    // Auto-save annotations
    if (window.currentSymbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
    
    // Clear form
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    document.getElementById('note-color').value = '#3b82f6';
    document.getElementById('note-type').value = 'general';
    
    // Properly close modal without ARIA conflicts
    try {
        const modalElement = document.getElementById('addNoteModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        } else {
            // Fallback: create new instance and hide
            const newModal = new bootstrap.Modal(modalElement);
            newModal.hide();
        }
        
        // Ensure modal backdrop is removed
        setTimeout(() => {
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Reset aria-hidden on body
            document.body.removeAttribute('aria-hidden');
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
        }, 300);
        
    } catch (error) {
        console.error('Error closing modal:', error);
    }
    
    showInfo(`Note "${title}" added successfully!`);
}

// Utility functions for UI feedback
function showError(message) {
    console.error(message);
    const errorToast = document.createElement('div');
    errorToast.className = 'toast align-items-center text-white bg-danger border-0';
    errorToast.setAttribute('role', 'alert');
    errorToast.setAttribute('aria-live', 'assertive');
    errorToast.setAttribute('aria-atomic', 'true');
    errorToast.style.position = 'fixed';
    errorToast.style.top = '20px';
    errorToast.style.right = '20px';
    errorToast.style.zIndex = '9999';
    
    errorToast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(errorToast);
    const toast = new bootstrap.Toast(errorToast);
    toast.show();
    
    setTimeout(() => {
        if (errorToast.parentNode) {
            errorToast.remove();
        }
    }, 5000);
}

function showInfo(message) {
    console.info(message);
    const infoToast = document.createElement('div');
    infoToast.className = 'toast align-items-center text-white bg-info border-0';
    infoToast.setAttribute('role', 'alert');
    infoToast.setAttribute('aria-live', 'assertive');
    infoToast.setAttribute('aria-atomic', 'true');
    infoToast.style.position = 'fixed';
    infoToast.style.top = '20px';
    infoToast.style.right = '20px';
    infoToast.style.zIndex = '9999';
    
    infoToast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-info-circle me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(infoToast);
    const toast = new bootstrap.Toast(infoToast);
    toast.show();
    
    setTimeout(() => {
        if (infoToast.parentNode) {
            infoToast.remove();
        }
    }, 4000);
}

function showLoading(show) {
    console.log(`showLoading called with: ${show}`); // 调试信息
    
    if (show) {
        // 先确保删除所有现有的loading元素
        const existingLoaders = document.querySelectorAll('#loading-indicator, .loading-indicator');
        existingLoaders.forEach(loader => loader.remove());
        
        // 创建新的loading元素
        const loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.className = 'd-flex justify-content-center align-items-center loading-indicator';
        loader.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.3) !important;
            z-index: 99999 !important;
            display: flex !important;
        `;
        loader.innerHTML = `
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loader);
        console.log('Loading indicator created and shown');
    } else {
        // 强力删除所有可能的loading元素
        const allLoaders = document.querySelectorAll('#loading-indicator, .loading-indicator, [id*="loading"], [class*="loading"]');
        let removedCount = 0;
        
        allLoaders.forEach(loader => {
            // 检查是否是我们的loading指示器
            if (loader.id === 'loading-indicator' || 
                loader.classList.contains('loading-indicator') ||
                loader.querySelector('.spinner-border')) {
                loader.remove();
                removedCount++;
            }
        });
        
        console.log(`Loading indicator(s) removed: ${removedCount}`);
        
        // 额外的安全措施：确保body上没有loading相关的类
        document.body.classList.remove('loading');
        
        // 如果还有问题，延迟再试一次
        setTimeout(() => {
            const remainingLoaders = document.querySelectorAll('#loading-indicator, .loading-indicator');
            if (remainingLoaders.length > 0) {
                console.log('Found remaining loaders, removing...');
                remainingLoaders.forEach(loader => loader.remove());
            }
        }, 100);
    }
}

// Function to render hot stocks
function renderHotStocks() {
    const hotStocksDiv = document.getElementById('hot-stocks');
    if (!hotStocksDiv) return;
    
    const hotStocksHTML = HOT_STOCKS.map(stock => 
        `<button class="btn btn-outline-primary btn-sm me-2 mb-2 hot-stock-btn" data-symbol="${stock.symbol}">
            ${stock.symbol}
        </button>`
    ).join('');
    
    hotStocksDiv.innerHTML = `
        <div class="hot-stocks-container">
            <small class="text-muted me-2">Quick access:</small>
            ${hotStocksHTML}
        </div>
    `;
    
    // Add event listeners for hot stock buttons
    document.querySelectorAll('.hot-stock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const symbol = this.dataset.symbol;
            document.getElementById('stock-symbol').value = symbol;
            searchStock();
    });
});
}

// Function to load saved indicator preferences
function loadSavedIndicatorPreferences() {
    // Don't load any saved preferences - start fresh each time
    // Ensure all indicators are off by default
    document.getElementById('sma-checkbox').checked = false;
    document.getElementById('rsi-checkbox').checked = false;
    document.getElementById('macd-checkbox').checked = false;
    
    // Hide all indicator badges
    document.getElementById('sma-indicator').style.display = 'none';
    document.getElementById('rsi-indicator').style.display = 'none';
    document.getElementById('macd-indicator').style.display = 'none';
    
    console.log('All indicators set to default (off) state');
}

// Function to setup indicator settings
function setupIndicatorSettings() {
    // Settings buttons in badges  
    document.querySelectorAll('.settings-indicator').forEach(btn => {
        btn.addEventListener('click', function() {
            const indicator = this.dataset.indicator;
            openIndicatorSettings(indicator);
        });
    });
    
    // SMA Settings
    const saveSmaBtn = document.getElementById('save-sma-settings');
    if (saveSmaBtn) {
        saveSmaBtn.addEventListener('click', () => {
            indicatorSettings.sma.period = parseInt(document.getElementById('sma-period').value);
            indicatorSettings.sma.color = document.getElementById('sma-color').value;
            indicatorSettings.sma.lineWidth = parseInt(document.getElementById('sma-width').value);
            indicatorSettings.sma.lineStyle = document.getElementById('sma-style').value;
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('smaSettingsModal'));
            modal.hide();
            
            // Update chart if SMA is active
            if (document.getElementById('sma-checkbox').checked) {
                updateChart();
            }
            
            showInfo('SMA settings updated successfully!');
        });
    }
    
    // RSI Settings
    const rsiSettingsBtn = document.getElementById('rsi-settings-btn');
    const saveRsiBtn = document.getElementById('save-rsi-settings');
    
    if (rsiSettingsBtn) {
        rsiSettingsBtn.addEventListener('click', () => {
            openIndicatorSettings('rsi');
        });
    }
    
    if (saveRsiBtn) {
        saveRsiBtn.addEventListener('click', () => {
            indicatorSettings.rsi.period = parseInt(document.getElementById('rsi-period').value);
            indicatorSettings.rsi.overbought = parseInt(document.getElementById('rsi-overbought').value);
            indicatorSettings.rsi.oversold = parseInt(document.getElementById('rsi-oversold').value);
            indicatorSettings.rsi.color = document.getElementById('rsi-color').value;
            indicatorSettings.rsi.lineWidth = parseInt(document.getElementById('rsi-width').value);
            indicatorSettings.rsi.lineStyle = document.getElementById('rsi-style').value;
            indicatorSettings.rsi.overboughtColor = document.getElementById('rsi-overbought-color').value;
            indicatorSettings.rsi.oversoldColor = document.getElementById('rsi-oversold-color').value;
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('rsiSettingsModal'));
            modal.hide();
            
            // Update chart if RSI is active
            if (document.getElementById('rsi-checkbox').checked) {
                updateChart();
            }
            
            showInfo('RSI settings updated successfully!');
        });
    }

    // MACD Settings
    const macdSettingsBtn = document.getElementById('macd-settings-btn');
    const saveMacdBtn = document.getElementById('save-macd-settings');
    
    if (macdSettingsBtn) {
        macdSettingsBtn.addEventListener('click', () => {
            openIndicatorSettings('macd');
        });
    }
    
    if (saveMacdBtn) {
        saveMacdBtn.addEventListener('click', () => {
            indicatorSettings.macd.fastPeriod = parseInt(document.getElementById('macd-fast').value);
            indicatorSettings.macd.slowPeriod = parseInt(document.getElementById('macd-slow').value);
            indicatorSettings.macd.signalPeriod = parseInt(document.getElementById('macd-signal').value);
            indicatorSettings.macd.macdColor = document.getElementById('macd-line-color').value;
            indicatorSettings.macd.signalColor = document.getElementById('macd-signal-color').value;
            indicatorSettings.macd.histogramColor = document.getElementById('macd-histogram-color').value;
            indicatorSettings.macd.lineWidth = parseInt(document.getElementById('macd-width').value);
            indicatorSettings.macd.lineStyle = document.getElementById('macd-style').value;
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('macdSettingsModal'));
            modal.hide();
            
            // Update chart if MACD is active
            if (document.getElementById('macd-checkbox').checked) {
                updateChart();
            }
            
            showInfo('MACD settings updated successfully!');
        });
    }
}

// Function to toggle chart type
function toggleChartType() {
    const lineBtn = document.getElementById('line-chart-btn');
    const candlestickBtn = document.getElementById('candlestick-chart-btn');
    
    if (chartType === 'line') {
        lineBtn.classList.add('active');
        candlestickBtn.classList.remove('active');
        } else {
        lineBtn.classList.remove('active');
        candlestickBtn.classList.add('active');
    }
    
    // Redraw chart with new type
    if (currentStockData) {
        drawChart(currentStockData);
    }
}

// Chart click handler
function handleChartClick(event, elements, ctx) {
    if (!stockChart) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const dataX = stockChart.scales.x.getValueForPixel(canvasPosition.x);
    const dataY = stockChart.scales.y.getValueForPixel(canvasPosition.y);
    
    // Handle drawing mode
    if (drawMode) {
        if (!drawingStartPoint) {
            // First click - set start point
            drawingStartPoint = { x: dataX, y: dataY };
            showInfo('Click second point to complete the line.');
            
            // Create preview line
            createPreviewLine(drawingStartPoint, drawingStartPoint);
        } else {
            // Second click - complete the line
            const endPoint = { x: dataX, y: dataY };
            
            // Remove preview line
            if (previewLineId && stockChart.options.plugins.annotation.annotations[previewLineId]) {
                delete stockChart.options.plugins.annotation.annotations[previewLineId];
            }
            
            // Add final line
            addTrendLine(drawingStartPoint, endPoint);
            
            // Reset drawing state
            drawMode = false;
            drawingStartPoint = null;
            previewLineId = null;
            
            // Reset button
            const drawBtn = document.getElementById('draw-line-btn');
            if (drawBtn) {
                drawBtn.classList.remove('active');
                drawBtn.textContent = 'Start Drawing';
            }
        }
        return;
    }
    
    // Handle signal mode
    if (signalMode) {
        addSignalToChart(dataX, dataY, signalMode);
        signalMode = false;
        return;
    }
    
    // Handle note mode
    if (noteMode) {
        noteMode = false;
        window.pendingNotePosition = {
            x: dataX,
            y: dataY,
            date: new Date(dataX).toLocaleDateString()
        };
        
        const modal = new bootstrap.Modal(document.getElementById('addNoteModal'));
        modal.show();
        return;
    }
    
    // Handle TP/SL mode
    if (tpSlMode) {
        handleTpSlClick(dataX, dataY);
        return;
    }
    
    // Handle annotation selection (when not in any special mode)
    const clickedAnnotation = findAnnotationAtPosition(canvasPosition);
    if (clickedAnnotation) {
        let annotationType = 'element';
        
        // Determine annotation type for better user feedback
        if (clickedAnnotation.id.startsWith('note')) {
            annotationType = 'note';
        } else if (clickedAnnotation.id.startsWith('signal_')) {
            annotationType = 'signal';
        } else if (clickedAnnotation.id.startsWith('tpsl_') || clickedAnnotation.type === 'tpsl_group') {
            annotationType = 'tpsl_group';
        } else if (clickedAnnotation.id.startsWith('trendLine')) {
            annotationType = 'line';
        }
        
        selectAnnotation(clickedAnnotation.id, annotationType);
    } else {
        // Click on empty area - deselect
        deselectAnnotation();
    }
}

// Add signal to chart
function addSignalToChart(x, y, signalType) {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    const id = 'signal_' + Date.now();
    const annotations = stockChart.options.plugins.annotation.annotations;
    
    // Use colored nodes for signals
    const signalColor = signalType === 'buy' ? '#22c55e' : '#ef4444';
    const labelText = window.customSignalLabel || (signalType === 'buy' ? 'Buy Signal' : 'Sell Signal');
    
    // Add the signal node - simplified for compatibility
    annotations[id] = {
        type: 'point',
        xValue: x,
        yValue: y,
        backgroundColor: signalColor,
        borderColor: '#ffffff',
        borderWidth: 3,
        radius: 15,
        // Make draggable
        draggable: true
    };
    
    // Add permanent text label for signals
    annotations[id + '_label'] = {
        type: 'label',
        xValue: x,
        yValue: y,
        content: labelText,
        backgroundColor: signalColor,
        borderColor: signalColor,
        borderWidth: 1,
        color: '#ffffff',
        font: {
            size: 10,
            weight: 'bold'
        },
        padding: 6,
        cornerRadius: 4,
        position: 'top',
        yAdjust: -30,
        // Make draggable
        draggable: true
    };
    
    stockChart.update('none');
    
    // Store in annotations
    chartAnnotations.signals.push({
        id: id,
        type: signalType,
        x: x,
        y: y,
        price: y.toFixed(2),
        date: new Date(x).toISOString(),
        customLabel: labelText
    });
    
    // Auto-save annotations
    if (window.currentSymbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
    
    // Clear the custom label for next use
    window.customSignalLabel = null;
    document.getElementById('signal-label').value = '';
    
    showInfo(`${signalType.toUpperCase()} signal "${labelText}" added at $${y.toFixed(2)}`);
}

// Calculate prediction
function calculatePrediction(data) {
    if (!data || !data.historicalData || data.historicalData.length < 5) {
        console.warn('Insufficient data for predictions');
        return;
    }
    
    try {
        const prices = data.historicalData.map(d => d.close).filter(p => p && !isNaN(p));
        const dates = data.historicalData.map(d => new Date(d.date));
        
        console.log('Calculating predictions with', prices.length, 'price points'); // Debug
        
        // Check if PredictionModels is available and has the method
        if (!PredictionModels || typeof PredictionModels.calculatePredictions !== 'function') {
            console.warn('PredictionModels.calculatePredictions not available, using fallback');
            
            // Enhanced fallback prediction calculation
            const lastPrice = prices[prices.length - 1];
            const recentPrices = prices.slice(-10); // Last 10 prices
            const trend = recentPrices.length > 1 ? 
                (recentPrices[recentPrices.length - 1] - recentPrices[0]) / (recentPrices.length - 1) : 0;
            
            // Simple moving average
            const movingAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
            
            // Linear projection
            const linearPrediction = lastPrice + (trend * 5); // Project 5 periods ahead
            
            // Exponential smoothing
            const alpha = 0.3;
            let exponentialPrediction = recentPrices[0];
            for (let i = 1; i < recentPrices.length; i++) {
                exponentialPrediction = alpha * recentPrices[i] + (1 - alpha) * exponentialPrediction;
            }
            exponentialPrediction = exponentialPrediction + (trend * 3);
            
            const predictions = {
                linear: Math.max(0, linearPrediction),
                movingAverage: Math.max(0, movingAvg),
                exponential: Math.max(0, exponentialPrediction),
                combined: Math.max(0, (linearPrediction + movingAvg + exponentialPrediction) / 3)
            };
            
            console.log('Fallback predictions calculated:', predictions); // Debug
            
            displayPredictionResults(predictions, data.currentPrice || lastPrice);
            
            // Ensure prediction lines are added to chart
            setTimeout(() => {
                addPredictionLinesToChart(predictions, dates, lastPrice);
            }, 100);
            return;
        }
        
        const predictions = PredictionModels.calculatePredictions(prices);
        console.log('Advanced predictions calculated:', predictions); // Debug
        
        displayPredictionResults(predictions, data.currentPrice || prices[prices.length - 1]);
        
        // Ensure prediction lines are added to chart with slight delay
        setTimeout(() => {
            addPredictionLinesToChart(predictions, dates, prices[prices.length - 1]);
        }, 100);
        
    } catch (error) {
        console.error('Error calculating predictions:', error);
        document.getElementById('prediction-result').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Unable to calculate predictions: ${error.message}
            </div>
        `;
    }
}

// Add prediction lines to chart
function addPredictionLinesToChart(predictions, dates, lastPrice) {
    if (!stockChart || !stockChart.options.plugins.annotation) {
        console.error('Chart or annotation plugin not available');
        return;
    }
    
    console.log('Adding prediction lines to chart...', predictions);
    
    // Remove existing prediction lines
    const annotations = stockChart.options.plugins.annotation.annotations;
    Object.keys(annotations).forEach(key => {
        if (key.startsWith('prediction_') || key === 'future_indicator') {
            delete annotations[key];
        }
    });
    
    // Get the last date and calculate future date for predictions
    const lastDate = dates[dates.length - 1];
    const timeInterval = dates.length > 1 ? dates[dates.length - 1] - dates[dates.length - 2] : 86400000; // 1 day fallback
    
    // Calculate future date for prediction endpoint (只预测5个时间节点)
    const predictionPeriods = 5;
    const futureDate = new Date(lastDate.getTime() + timeInterval * predictionPeriods);
    
    console.log('Last date:', lastDate, 'Future date:', futureDate, 'Last price:', lastPrice);
    
    // Prediction colors and styles
    const predictionStyles = {
        linear: { color: '#3b82f6', name: 'Linear Trend', dash: [10, 5] },
        movingAverage: { color: '#10b981', name: 'Moving Average', dash: [15, 3] },
        exponential: { color: '#f59e0b', name: 'Exponential', dash: [5, 10] },
        combined: { color: '#ef4444', name: 'Combined', dash: [8, 8] }
    };
    
    let linesAdded = 0;
    
    // Add prediction lines for each model
    Object.entries(predictions).forEach(([predictionType, targetPrice], index) => {
        if (!targetPrice || isNaN(targetPrice) || targetPrice <= 0) {
            console.warn(`Invalid prediction for ${predictionType}:`, targetPrice);
            return;
        }
        
        const style = predictionStyles[predictionType];
        if (!style) {
            console.warn(`No style defined for prediction type: ${predictionType}`);
            return;
        }
        
        console.log(`Adding ${predictionType} prediction line: ${lastPrice} -> ${targetPrice}`);
        
        // Add main prediction line from current price to predicted price
        annotations[`prediction_${predictionType}_line`] = {
            type: 'line',
            xMin: lastDate,
            xMax: futureDate,
            yMin: lastPrice,
            yMax: targetPrice,
            borderColor: style.color,
            borderWidth: 3,
            borderDash: style.dash,
            label: {
                enabled: true,
                content: `${style.name}: $${targetPrice.toFixed(2)}`,
                position: 'end',
                backgroundColor: style.color,
                color: '#ffffff',
                font: { size: 11, weight: 'bold' },
                padding: 6,
                cornerRadius: 4,
                xAdjust: 15,
                yAdjust: index * 25 - 35 // 减少标签之间的间距
            }
        };
        
        // Add prediction endpoint marker
        annotations[`prediction_${predictionType}_endpoint`] = {
            type: 'point',
            xValue: futureDate,
            yValue: targetPrice,
            backgroundColor: style.color,
            borderColor: '#ffffff',
            borderWidth: 2,
            radius: 6
        };
        
        // Add horizontal price level line (shorter)
        annotations[`prediction_${predictionType}_level`] = {
            type: 'line',
            xMin: lastDate,
            xMax: futureDate,
            yMin: targetPrice,
            yMax: targetPrice,
            borderColor: style.color,
            borderWidth: 1,
            borderDash: [3, 3],
            label: {
                enabled: true,
                content: `$${targetPrice.toFixed(2)}`,
                position: 'start',
                backgroundColor: style.color,
                color: '#ffffff',
                font: { size: 10, weight: 'bold' },
                padding: 4,
                cornerRadius: 3,
                xAdjust: -10
            }
        };
        
        linesAdded++;
    });
    
    // Add vertical line to mark start of predictions (shorter)
    const futureStartDate = new Date(lastDate.getTime() + timeInterval * 0.5);
    annotations['future_indicator'] = {
        type: 'line',
        xMin: futureStartDate,
        xMax: futureStartDate,
        borderColor: '#94a3b8',
        borderWidth: 2,
        borderDash: [6, 6],
        label: {
            enabled: true,
            content: '5-Period Predictions →',
            position: 'start',
            backgroundColor: '#94a3b8',
            color: '#ffffff',
            font: { size: 11, weight: 'bold' },
            padding: 6,
            cornerRadius: 4,
            yAdjust: -25
        }
    };
    
    // Update chart
    stockChart.update('none');
    
    if (linesAdded > 0) {
        showInfo(`${linesAdded} price prediction lines added (5-period forecast)`);
        console.log(`Successfully added ${linesAdded} prediction lines`);
    } else {
        showError('Failed to add prediction lines - invalid prediction data');
        console.error('No valid prediction data to display');
    }
}

// Clear prediction lines from chart
function clearPredictionLines() {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    const annotations = stockChart.options.plugins.annotation.annotations;
    Object.keys(annotations).forEach(key => {
        if (key.startsWith('prediction_')) {
            delete annotations[key];
        }
    });
    
    if (stockChart.update) {
        stockChart.update('none');
    }
}

// Helper function to display prediction results
function displayPredictionResults(predictions, currentPrice) {
    const predictionDiv = document.getElementById('prediction-result');
    
    predictionDiv.innerHTML = `
        <div class="prediction-item">
            <div class="prediction-label">
                <i class="fas fa-chart-line text-primary"></i>
                Linear Trend
            </div>
            <div class="prediction-value ${predictions.linear > currentPrice ? 'positive' : 'negative'}">
                $${predictions.linear.toFixed(2)}
                <small class="prediction-change">
                    ${predictions.linear > currentPrice ? '+' : ''}${((predictions.linear - currentPrice) / currentPrice * 100).toFixed(1)}%
                </small>
            </div>
        </div>
        
        <div class="prediction-item">
            <div class="prediction-label">
                <i class="fas fa-chart-area text-success"></i>
                Moving Average
            </div>
            <div class="prediction-value ${predictions.movingAverage > currentPrice ? 'positive' : 'negative'}">
                $${predictions.movingAverage.toFixed(2)}
                <small class="prediction-change">
                    ${predictions.movingAverage > currentPrice ? '+' : ''}${((predictions.movingAverage - currentPrice) / currentPrice * 100).toFixed(1)}%
                </small>
            </div>
        </div>
        
        <div class="prediction-item">
            <div class="prediction-label">
                <i class="fas fa-chart-bar text-info"></i>
                Exponential
            </div>
            <div class="prediction-value ${predictions.exponential > currentPrice ? 'positive' : 'negative'}">
                $${predictions.exponential.toFixed(2)}
                <small class="prediction-change">
                    ${predictions.exponential > currentPrice ? '+' : ''}${((predictions.exponential - currentPrice) / currentPrice * 100).toFixed(1)}%
                </small>
            </div>
        </div>
        
        <div class="prediction-item highlight">
            <div class="prediction-label">
                <i class="fas fa-star text-warning"></i>
                Combined
            </div>
            <div class="prediction-value ${predictions.combined > currentPrice ? 'positive' : 'negative'}">
                $${predictions.combined.toFixed(2)}
                <small class="prediction-change">
                    ${predictions.combined > currentPrice ? '+' : ''}${((predictions.combined - currentPrice) / currentPrice * 100).toFixed(1)}%
                </small>
            </div>
        </div>
    `;
}

// 强力清除所有loading指示器的函数
function clearAllLoadingIndicators() {
    // 查找所有可能的loading元素
    const selectors = [
        '#loading-indicator',
        '.loading-indicator', 
        '.spinner-border',
        '[class*="loading"]',
        '[id*="loading"]',
        '.loading',
        '.loader'
    ];
    
    let totalRemoved = 0;
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // 只删除看起来像loading指示器的元素
            if (el.querySelector('.spinner-border') || 
                el.style.position === 'fixed' ||
                el.id === 'loading-indicator' ||
                el.classList.contains('loading-indicator')) {
                el.remove();
                removedCount++;
            }
        });
    });
    
    // 清除body上的loading类
    document.body.classList.remove('loading');
    
    // 确保没有元素有loading样式
    document.querySelectorAll('*').forEach(el => {
        if (el.style.display === 'flex' && 
            el.style.position === 'fixed' && 
            el.style.zIndex > 1000) {
            const hasSpinner = el.querySelector('.spinner-border');
            if (hasSpinner) {
                el.remove();
                totalRemoved++;
            }
        }
    });
    
    console.log(`Total loading indicators removed: ${totalRemoved}`);
    return totalRemoved;
}

// Draw candlestick chart using custom implementation with proper OHLC representation
function drawCandlestickChart(validData, chartDiv, theme) {
    console.log('Drawing OHLC candlestick chart with', validData.length, 'data points');
    
    try {
        // Clear container
        chartDiv.innerHTML = '';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'stockChart-canvas';
        chartDiv.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        
        // Prepare candlestick data with proper OHLC values
        const candlestickData = validData.map((d, index) => ({
            x: new Date(d.date),
            open: d.open || d.close,
            high: d.high || d.close,
            low: d.low || d.close,
            close: d.close,
            change: d.close - (d.open || d.close),
            volume: d.volume || 0,
            index: index
        }));
        
        // Create datasets - start with hidden price line for technical indicators
        const datasets = [];
        
        // Add close price line (hidden but used for technical analysis)
        datasets.push({
            label: 'Close Price',
            type: 'line',
            data: candlestickData.map(d => ({
                x: d.x,
                y: d.close
            })),
            borderColor: 'rgba(156, 163, 175, 0.0)', // Fully transparent
            backgroundColor: 'transparent',
            borderWidth: 0,
            pointRadius: 0,
            fill: false,
            order: 1,
            tension: 0,
            hidden: true // Hide this line by default
        });
        
        // Initialize scales for indicators
        const scales = {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MMM D',
                        week: 'MMM D',
                        month: 'MMM YYYY'
                    }
                },
                grid: {
                    color: theme.gridColor,
                    display: false // Clean candlestick appearance
                },
                ticks: {
                    color: theme.textColor,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 8
                }
            },
            y: {
                grid: {
                    color: theme.gridColor,
                    drawBorder: false
                },
                ticks: {
                    color: theme.textColor,
                    callback: function(value) {
                        return '$' + value.toFixed(2);
                    }
                }
            }
        };
        
        // Add technical indicators based on checkboxes
        addIntegratedIndicators(datasets, scales, validData, theme);
        
        // Create proper OHLC candlesticks using annotations
        const candleAnnotations = {};
        
        // Calculate time interval for candle width
        const timeInterval = candlestickData.length > 1 ? 
            candlestickData[1].x - candlestickData[0].x : 86400000; // 1 day fallback
        const candleWidth = timeInterval * 0.6; // 60% of time interval for candle width
        
        candlestickData.forEach((d, index) => {
            const isUp = d.change >= 0;
            const candleColor = isUp ? '#22c55e' : '#ef4444'; // Green up, Red down
            const wickColor = isUp ? '#16a34a' : '#dc2626';   // Darker shade for wicks
            
            const bodyTop = Math.max(d.open, d.close);
            const bodyBottom = Math.min(d.open, d.close);
            const bodyHeight = bodyTop - bodyBottom;
            
            // Create candle body (rectangle from open to close)
            if (bodyHeight > 0) {
                // Normal candle with visible body
                candleAnnotations[`candle_body_${index}`] = {
                    type: 'box',
                    xMin: new Date(d.x.getTime() - candleWidth / 2),
                    xMax: new Date(d.x.getTime() + candleWidth / 2),
                    yMin: bodyBottom,
                    yMax: bodyTop,
                    backgroundColor: isUp ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                    borderColor: wickColor,
                    borderWidth: 1,
                    draggable: true
                };
            } else {
                // Doji candle (open == close) - show as horizontal line
                candleAnnotations[`candle_doji_${index}`] = {
                    type: 'line',
                    xMin: new Date(d.x.getTime() - candleWidth / 2),
                    xMax: new Date(d.x.getTime() + candleWidth / 2),
                    yMin: d.close,
                    yMax: d.close,
                    borderColor: '#64748b',
                    borderWidth: 2,
                    draggable: true
                };
            }
            
            // Create upper shadow/wick (from body top to high)
            if (d.high > bodyTop) {
                candleAnnotations[`candle_upper_wick_${index}`] = {
                    type: 'line',
                    xMin: d.x,
                    xMax: d.x,
                    yMin: bodyTop,
                    yMax: d.high,
                    borderColor: wickColor,
                    borderWidth: 1.5,
                    draggable: true
                };
            }
            
            // Create lower shadow/wick (from low to body bottom)
            if (d.low < bodyBottom) {
                candleAnnotations[`candle_lower_wick_${index}`] = {
                    type: 'line',
                    xMin: d.x,
                    xMax: d.x,
                    yMin: d.low,
                    yMax: bodyBottom,
                    borderColor: wickColor,
                    borderWidth: 1.5,
                    draggable: true
                };
            }
            
            // Add invisible hover area for better interaction
            candleAnnotations[`candle_hover_${index}`] = {
                type: 'box',
                xMin: new Date(d.x.getTime() - candleWidth / 2),
                xMax: new Date(d.x.getTime() + candleWidth / 2),
                yMin: d.low,
                yMax: d.high,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
                // Store OHLC data for tooltips
                ohlcData: {
                    date: d.x,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                    change: d.change,
                    volume: d.volume
                }
            };
        });
        
        // Configure chart
        const config = {
            type: 'line', // Use line chart as base
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                onClick: (event, elements) => {
                    handleChartClick(event, elements, ctx);
                },
                onHover: (event, elements) => {
                    if (drawMode && drawingStartPoint) {
                        handleChartMouseMove(event);
                    }
                    handleNoteHover(event, elements);
                    handleDragHover(event); // Add custom candle hover
                    showCrosshair(event);
                },
                onLeave: () => {
                    hideCrosshair();
                    hideNotePopup();
                    hideSignalPopup();
                    hideCandleTooltip(); // Hide candle tooltip
                    if (isDragging) {
                        finalizeDrag();
                    }
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.05,
                                modifierKey: null
                            },
                            pinch: {
                                enabled: true,
                                scale: 0.1
                            },
                            mode: 'xy', // Allow both x and y zoom
                            onZoomComplete: function(chart) {
                                console.log('Zoom completed on both axes');
                            }
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy', // Allow both x and y pan
                            threshold: 5,
                            rangeMin: {
                                x: null,
                                y: null
                            },
                            rangeMax: {
                                x: null,
                                y: null
                            },
                            onPanComplete: function(chart) {
                                console.log('Pan completed on both axes');
                            }
                        }
                        // Remove limits to allow unrestricted scrolling and panning
                    },
                    legend: {
                        display: true,
                        labels: {
                            color: theme.textColor,
                            filter: function(legendItem, chartData) {
                                // Only show legend for technical indicators
                                return !legendItem.text.includes('Close Price');
                            }
                        }
                    },
                    tooltip: {
                        enabled: false, // Disable default tooltip, use custom candle tooltip
                    },
                    annotation: {
                        annotations: candleAnnotations
                    }
                },
                scales: scales
            }
        };
        
        // Create chart
        stockChart = new Chart(ctx, config);
        
        // Store candlestick data for hover functionality
        stockChart.candlestickData = candlestickData;
        
        // 简化事件监听器，避免与平移功能冲突
        if (stockChart && stockChart.canvas) {
            // 只在特定模式下才添加自定义事件监听器
            const addCustomListeners = () => {
                if (drawMode || signalMode || noteMode || tpSlMode || isDragging) {
                    stockChart.canvas.addEventListener('mousedown', handleMouseDown, { passive: false });
                    stockChart.canvas.addEventListener('mousemove', handleMouseMove, { passive: false });
                    stockChart.canvas.addEventListener('mouseup', handleMouseUp, { passive: false });
                }
            };
            
            // 监听模式变化
            let lastModeState = false;
            const checkModeChange = () => {
                const currentModeState = drawMode || signalMode || noteMode || tpSlMode || isDragging;
                if (currentModeState !== lastModeState) {
                    if (currentModeState) {
                        addCustomListeners();
                    } else {
                        // 移除自定义监听器以恢复平移功能
                        stockChart.canvas.removeEventListener('mousedown', handleMouseDown);
                        stockChart.canvas.removeEventListener('mousemove', handleMouseMove);
                        stockChart.canvas.removeEventListener('mouseup', handleMouseUp);
                    }
                    lastModeState = currentModeState;
                }
                requestAnimationFrame(checkModeChange);
            };
            
            checkModeChange();
        }
        
        // Store note data
        if (!stockChart.noteData) {
            stockChart.noteData = {};
        }
        
        // Apply annotations after chart is created with longer delay for stability
        setTimeout(() => {
            applyChartAnnotations();
        }, 200);
        
        window.dispatchEvent(new CustomEvent('chartRendered'));
        showInfo('Professional OHLC candlestick chart created successfully');
        
    } catch (error) {
        console.error('Error creating candlestick chart:', error);
        showError('Failed to create candlestick chart: ' + error.message);
        
        // Fallback to line chart
        console.log('Falling back to line chart');
        chartType = 'line';
        drawLineChart(validData, chartDiv, theme, { historicalData: validData, interval: 'day' });
    }
}

// Show signal popup on hover
function showSignalPopup(event, signal, x, y) {
    let popup = document.getElementById('signal-popup');
    
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'signal-popup';
        popup.className = 'signal-popup';
        popup.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 6px;
            font-size: 12px;
            max-width: 200px;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid ${signal.type === 'buy' ? '#22c55e' : '#ef4444'};
        `;
        document.body.appendChild(popup);
    }
    
    const signalColor = signal.type === 'buy' ? '#22c55e' : '#ef4444';
    popup.style.borderColor = signalColor;
    
    popup.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px; color: ${signalColor};">
            ${signal.customLabel || (signal.type === 'buy' ? 'Buy Signal' : 'Sell Signal')}
        </div>
        <div style="margin-bottom: 4px;">
            Price: $${signal.price}
        </div>
        <div style="font-size: 10px; opacity: 0.7;">
            ${new Date(signal.date).toLocaleDateString()}
        </div>
    `;
    
    // Position popup near mouse
    const rect = stockChart.canvas.getBoundingClientRect();
    popup.style.left = (rect.left + x + 15) + 'px';
    popup.style.top = (rect.top + y - 40) + 'px';
    popup.style.display = 'block';
}

// Hide signal popup
function hideSignalPopup() {
    const popup = document.getElementById('signal-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Function to open indicator settings modal
function openIndicatorSettings(indicator) {
    let modal;
    
    switch(indicator) {
        case 'sma':
            // Populate SMA settings
            document.getElementById('sma-period').value = indicatorSettings.sma.period;
            document.getElementById('sma-color').value = indicatorSettings.sma.color;
            document.getElementById('sma-width').value = indicatorSettings.sma.lineWidth;
            document.getElementById('sma-style').value = indicatorSettings.sma.lineStyle;
            
            modal = new bootstrap.Modal(document.getElementById('smaSettingsModal'));
            modal.show();
            break;
            
        case 'rsi':
            // Populate RSI settings
            document.getElementById('rsi-period').value = indicatorSettings.rsi.period;
            document.getElementById('rsi-overbought').value = indicatorSettings.rsi.overbought;
            document.getElementById('rsi-oversold').value = indicatorSettings.rsi.oversold;
            document.getElementById('rsi-color').value = indicatorSettings.rsi.color;
            document.getElementById('rsi-width').value = indicatorSettings.rsi.lineWidth;
            document.getElementById('rsi-style').value = indicatorSettings.rsi.lineStyle;
            document.getElementById('rsi-overbought-color').value = indicatorSettings.rsi.overboughtColor;
            document.getElementById('rsi-oversold-color').value = indicatorSettings.rsi.oversoldColor;
            
            modal = new bootstrap.Modal(document.getElementById('rsiSettingsModal'));
            modal.show();
            break;
            
        case 'macd':
            // Populate MACD settings
            document.getElementById('macd-fast').value = indicatorSettings.macd.fastPeriod;
            document.getElementById('macd-slow').value = indicatorSettings.macd.slowPeriod;
            document.getElementById('macd-signal').value = indicatorSettings.macd.signalPeriod;
            document.getElementById('macd-line-color').value = indicatorSettings.macd.macdColor;
            document.getElementById('macd-signal-color').value = indicatorSettings.macd.signalColor;
            document.getElementById('macd-histogram-color').value = indicatorSettings.macd.histogramColor;
            document.getElementById('macd-width').value = indicatorSettings.macd.lineWidth;
            document.getElementById('macd-style').value = indicatorSettings.macd.lineStyle;
            
            modal = new bootstrap.Modal(document.getElementById('macdSettingsModal'));
            modal.show();
            break;
            
        default:
            console.warn('Unknown indicator:', indicator);
            showError('Settings not available for indicator: ' + indicator);
    }
}

// Enhanced chart options for drag functionality
function getChartOptions(theme, ctx) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        onClick: (event, elements) => {
            handleChartClick(event, elements, ctx);
        },
        onHover: (event, elements) => {
            if (drawMode && drawingStartPoint) {
                handleChartMouseMove(event);
            }
            handleNoteHover(event, elements);
            handleDragHover(event);
            showCrosshair(event);
        },
        onLeave: () => {
            hideCrosshair();
            hideNotePopup();
            hideSignalPopup();
            if (isDragging) {
                finalizeDrag();
            }
        },
        // Add mouse event handlers for dragging
        onMouseDown: (event) => {
            handleMouseDown(event);
        },
        onMouseMove: (event) => {
            handleMouseMove(event);
        },
        onMouseUp: (event) => {
            handleMouseUp(event);
        }
    };
}

// Handle mouse down for dragging
function handleMouseDown(event) {
    if (!stockChart || drawMode || signalMode || noteMode || tpSlMode) return;
    
    // 检查是否按住了Ctrl键，如果没有，优先启用平移功能
    if (!event.ctrlKey) {
        // 不干扰正常的平移功能
        return;
    }
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const draggedAnnotation = findAnnotationAtPosition(canvasPosition);
    
    // 只有在按住Ctrl键且点击了注释时才启用拖拽
    if (draggedAnnotation && event.ctrlKey) {
        isDragging = true;
        dragTarget = draggedAnnotation;
        dragStartPosition = {
            x: stockChart.scales.x.getValueForPixel(canvasPosition.x),
            y: stockChart.scales.y.getValueForPixel(canvasPosition.y)
        };
        
        // 暂时禁用平移以便拖拽注释
        if (stockChart.options.plugins.zoom.pan) {
            stockChart.options.plugins.zoom.pan.enabled = false;
        }
        
        // 更改光标表示拖拽状态
        stockChart.canvas.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Annotation drag started:', draggedAnnotation.id);
    }
}

// Handle mouse move for dragging
function handleMouseMove(event) {
    if (!isDragging || !dragTarget) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const currentPosition = {
        x: stockChart.scales.x.getValueForPixel(canvasPosition.x),
        y: stockChart.scales.y.getValueForPixel(canvasPosition.y)
    };
    
    // Update annotation position
    updateAnnotationPosition(dragTarget, currentPosition);
    stockChart.update('none');
    
    event.preventDefault();
}

// Handle mouse up for dragging
function handleMouseUp(event) {
    if (isDragging && dragTarget) {
        // Finalize the drag operation
        finalizeDrag();
        
        // Re-enable pan functionality after annotation dragging
        if (stockChart.options.plugins.zoom.pan) {
            stockChart.options.plugins.zoom.pan.enabled = true;
        }
        
        console.log('Annotation drag completed');
    }
}

// Handle drag hover (change cursor when over draggable elements)
function handleDragHover(event) {
    if (isDragging || drawMode || signalMode || noteMode || tpSlMode) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const annotation = findAnnotationAtPosition(canvasPosition);
    
    if (annotation) {
        stockChart.canvas.style.cursor = 'grab';
        
        // Show tooltip for draggable elements
        let elementType = 'Element';
        if (annotation.id.startsWith('note')) {
            elementType = 'Note';
        } else if (annotation.id.startsWith('signal_')) {
            elementType = 'Signal';
        } else if (annotation.id.startsWith('tpsl_') || annotation.type === 'tpsl_group') {
            elementType = 'TP/SL Setup';
        } else if (annotation.id.startsWith('trendLine')) {
            elementType = 'Trend Line';
        } else if (annotation.type === 'tpsl_line') {
            if (annotation.id.includes('_tp')) {
                elementType = 'Take Profit Line';
            } else if (annotation.id.includes('_sl')) {
                elementType = 'Stop Loss Line';
            } else if (annotation.id.includes('_entry')) {
                elementType = 'Entry Line';
            }
        }
        
        // Update canvas title for accessibility
        stockChart.canvas.title = `${elementType} - Ctrl+Click to drag, Delete key to remove`;
    } else {
        stockChart.canvas.style.cursor = 'default';
        stockChart.canvas.title = 'Stock Chart - Drag to pan chart, Mouse wheel to zoom, Ctrl+Click annotations to drag';
    }
}

// Find annotation at mouse position
function findAnnotationAtPosition(canvasPosition) {
    if (!stockChart || !stockChart.options.plugins.annotation) return null;
    
    const annotations = stockChart.options.plugins.annotation.annotations;
    
    // First check for individual TPSL lines (for range adjustment)
    for (const annotationId in annotations) {
        const annotation = annotations[annotationId];
        
        // Skip candle annotations - they should not be draggable
        if (annotationId.startsWith('candle_')) continue;
        
        if (annotation.type === 'line' && (annotationId.includes('_tp') || annotationId.includes('_sl') || annotationId.includes('_entry'))) {
            const pixelY = stockChart.scales.y.getPixelForValue(annotation.yMin);
            
            if (Math.abs(canvasPosition.y - pixelY) <= 15) { // Increased tolerance for easier selection
                return { id: annotationId, annotation: annotation, type: 'tpsl_line' };
            }
        }
    }
    
    // Then check for TPSL boxes (for moving entire setup)
    for (const annotationId in annotations) {
        const annotation = annotations[annotationId];
        
        // Skip candle annotations
        if (annotationId.startsWith('candle_')) continue;
        
        if (annotation.type === 'box' && (annotationId.includes('_tp_zone') || annotationId.includes('_sl_zone'))) {
            const minPixelX = stockChart.scales.x.getPixelForValue(annotation.xMin);
            const maxPixelX = stockChart.scales.x.getPixelForValue(annotation.xMax);
            const minPixelY = stockChart.scales.y.getPixelForValue(annotation.yMax);
            const maxPixelY = stockChart.scales.y.getPixelForValue(annotation.yMin);
            
            if (canvasPosition.x >= minPixelX && canvasPosition.x <= maxPixelX &&
                canvasPosition.y >= minPixelY && canvasPosition.y <= maxPixelY) {
                // Return the base TPSL ID so we can move the entire setup
                const baseId = getBaseAnnotationId(annotationId);
                return { id: baseId, annotation: annotation, type: 'tpsl_group' };
            }
        }
    }
    
    // Then check for other elements
    for (const annotationId in annotations) {
        const annotation = annotations[annotationId];
        
        // Skip candle annotations
        if (annotationId.startsWith('candle_')) continue;
        
        if (annotation.type === 'point') {
            const pixelX = stockChart.scales.x.getPixelForValue(annotation.xValue);
            const pixelY = stockChart.scales.y.getPixelForValue(annotation.yValue);
            
            const distance = Math.sqrt(
                Math.pow(canvasPosition.x - pixelX, 2) + 
                Math.pow(canvasPosition.y - pixelY, 2)
            );
            
            if (distance <= (annotation.radius || 10) + 5) {
                return { id: annotationId, annotation: annotation, type: 'point' };
            }
        } else if (annotation.type === 'label') {
            const pixelX = stockChart.scales.x.getPixelForValue(annotation.xValue);
            const pixelY = stockChart.scales.y.getPixelForValue(annotation.yValue);
            
            // Approximate label bounds (simplified)
            const labelWidth = 60; // Approximate
            const labelHeight = 20; // Approximate
            
            if (canvasPosition.x >= pixelX - labelWidth/2 && 
                canvasPosition.x <= pixelX + labelWidth/2 &&
                canvasPosition.y >= pixelY - labelHeight - 30 && 
                canvasPosition.y <= pixelY - 10) {
                return { id: annotationId, annotation: annotation, type: 'label' };
            }
        } else if (annotation.type === 'line' && !annotationId.includes('_tp') && !annotationId.includes('_sl') && !annotationId.includes('_entry')) {
            // Only allow line dragging for non-TPSL lines (like trend lines)
            const pixelY = stockChart.scales.y.getPixelForValue(annotation.yMin);
            
            if (Math.abs(canvasPosition.y - pixelY) <= 10) {
                return { id: annotationId, annotation: annotation, type: 'line' };
            }
        }
    }
    
    return null;
}

// Update annotation position during drag
function updateAnnotationPosition(dragTarget, newPosition) {
    const annotation = dragTarget.annotation;
    const baseId = getBaseAnnotationId(dragTarget.id);
    
    if (dragTarget.type === 'point' || dragTarget.type === 'label') {
        // Update point/label position
        annotation.xValue = newPosition.x;
        annotation.yValue = newPosition.y;
        
        // Update associated label/point if exists
        const annotations = stockChart.options.plugins.annotation.annotations;
        if (dragTarget.type === 'point' && annotations[baseId + '_label']) {
            annotations[baseId + '_label'].xValue = newPosition.x;
            annotations[baseId + '_label'].yValue = newPosition.y;
        } else if (dragTarget.type === 'label' && annotations[baseId]) {
            annotations[baseId].xValue = newPosition.x;
            annotations[baseId].yValue = newPosition.y;
        }
        
        // Update stored data
        updateStoredAnnotationData(baseId, newPosition);
        
    } else if (dragTarget.type === 'tpsl_group') {
        // Update entire TPSL setup position
        const offsetX = newPosition.x - dragStartPosition.x;
        const offsetY = newPosition.y - dragStartPosition.y;
        
        // Update all TPSL annotations for this group
        updateTpSlPosition(dragTarget.id, offsetX, offsetY);
        
    } else if (dragTarget.type === 'tpsl_line') {
        // Update individual TPSL line position (for range adjustment)
        const offsetY = newPosition.y - dragStartPosition.y;
        annotation.yMin += offsetY;
        annotation.yMax += offsetY;
        
        // Update TPSL data and recalculate zones
        updateTpSlLinePosition(dragTarget.id, offsetY);
        
    } else if (dragTarget.type === 'box') {
        // Update box position (move entire TPSL setup) - legacy support
        const offsetX = newPosition.x - dragStartPosition.x;
        const offsetY = newPosition.y - dragStartPosition.y;
        
        annotation.xMin += offsetX;
        annotation.xMax += offsetX;
        annotation.yMin += offsetY;
        annotation.yMax += offsetY;
        
        // Update associated TPSL elements
        updateTpSlPosition(baseId, offsetX, offsetY);
        
    } else if (dragTarget.type === 'line') {
        // Update line position
        const offsetY = newPosition.y - dragStartPosition.y;
        annotation.yMin += offsetY;
        annotation.yMax += offsetY;
        
        // Update TPSL data
        updateTpSlLinePosition(baseId, offsetY);
    }
    
    // Update drag start position
    dragStartPosition = newPosition;
}

// Get base annotation ID (remove suffix like '_label', '_tp_zone', etc.)
function getBaseAnnotationId(fullId) {
    // For TPSL annotations, extract the base tpsl_TIMESTAMP part
    if (fullId.startsWith('tpsl_')) {
        const parts = fullId.split('_');
        if (parts.length >= 2) {
            return parts[0] + '_' + parts[1]; // Return "tpsl_TIMESTAMP"
        }
    }
    
    // For other annotations like signals and notes
    if (fullId.includes('_')) {
        const parts = fullId.split('_');
        if (parts.length >= 2) {
            return parts[0] + '_' + parts[1];
        }
    }
    
    return fullId;
}

// Update stored annotation data
function updateStoredAnnotationData(baseId, newPosition) {
    // Update notes
    const noteIndex = chartAnnotations.notes.findIndex(note => note.id === baseId);
    if (noteIndex !== -1) {
        chartAnnotations.notes[noteIndex].x = newPosition.x;
        chartAnnotations.notes[noteIndex].y = newPosition.y;
        
        // Update note data for hover
        if (stockChart.noteData && stockChart.noteData[baseId]) {
            stockChart.noteData[baseId].x = newPosition.x;
            stockChart.noteData[baseId].y = newPosition.y;
        }
        return; // Exit early for notes
    }
    
    // Update signals
    const signalIndex = chartAnnotations.signals.findIndex(signal => signal.id === baseId);
    if (signalIndex !== -1) {
        chartAnnotations.signals[signalIndex].x = newPosition.x;
        chartAnnotations.signals[signalIndex].y = newPosition.y;
        chartAnnotations.signals[signalIndex].price = newPosition.y.toFixed(2);
        chartAnnotations.signals[signalIndex].date = new Date(newPosition.x).toISOString();
        
        // Update associated label position for signals
        const annotations = stockChart.options.plugins.annotation.annotations;
        if (annotations[baseId + '_label']) {
            annotations[baseId + '_label'].xValue = newPosition.x;
            annotations[baseId + '_label'].yValue = newPosition.y;
        }
    }
}

// Update TPSL position
function updateTpSlPosition(baseId, offsetX, offsetY) {
    const annotations = stockChart.options.plugins.annotation.annotations;
    const tpslIndex = chartAnnotations.tpsl.findIndex(tpsl => tpsl.id === baseId);
    
    if (tpslIndex !== -1) {
        const tpsl = chartAnnotations.tpsl[tpslIndex];
        
        // Update stored positions
        tpsl.entry.x += offsetX;
        tpsl.entry.y += offsetY;
        tpsl.stopLoss.x += offsetX;
        tpsl.stopLoss.y += offsetY;
        tpsl.takeProfit.x += offsetX;
        tpsl.takeProfit.y += offsetY;
        
        // Update all TPSL annotations
        Object.keys(annotations).forEach(key => {
            if (key.startsWith(baseId)) {
                const annotation = annotations[key];
                if (annotation.type === 'box') {
                    annotation.xMin += offsetX;
                    annotation.xMax += offsetX;
                    annotation.yMin += offsetY;
                    annotation.yMax += offsetY;
                } else if (annotation.type === 'line') {
                    annotation.yMin += offsetY;
                    annotation.yMax += offsetY;
                } else if (annotation.type === 'point') {
                    annotation.xValue += offsetX;
                    annotation.yValue += offsetY;
                }
            }
        });
    }
}

// Update TPSL line position
function updateTpSlLinePosition(fullId, offsetY) {
    const baseId = getBaseAnnotationId(fullId);
    const tpslIndex = chartAnnotations.tpsl.findIndex(tpsl => fullId.startsWith(tpsl.id));
    
    if (tpslIndex !== -1) {
        const tpsl = chartAnnotations.tpsl[tpslIndex];
        const annotations = stockChart.options.plugins.annotation.annotations;
        
        // Determine which line was moved and update accordingly
        if (fullId.includes('_entry')) {
            tpsl.entry.y += offsetY;
        } else if (fullId.includes('_tp')) {
            tpsl.takeProfit.y += offsetY;
        } else if (fullId.includes('_sl')) {
            tpsl.stopLoss.y += offsetY;
        }
        
        // Recalculate risk/reward ratio
        const risk = Math.abs(tpsl.entry.y - tpsl.stopLoss.y);
        const reward = Math.abs(tpsl.takeProfit.y - tpsl.entry.y);
        tpsl.riskReward = (reward / risk).toFixed(2);
        
        // Update info label
        const infoKey = tpsl.id + '_info';
        if (annotations[infoKey] && annotations[infoKey].label) {
            annotations[infoKey].label.content = `${tpsl.type.toUpperCase()} R:R ${tpsl.riskReward}:1`;
        }
        
        // Recalculate and update zones
        const minX = Math.min(tpsl.entry.x, tpsl.stopLoss.x, tpsl.takeProfit.x);
        const maxX = Math.max(tpsl.entry.x, tpsl.stopLoss.x, tpsl.takeProfit.x);
        const boxWidth = (maxX - minX) || 86400000;
        
        // Update Take Profit zone
        const tpMinY = Math.min(tpsl.entry.y, tpsl.takeProfit.y);
        const tpMaxY = Math.max(tpsl.entry.y, tpsl.takeProfit.y);
        const tpZoneKey = tpsl.id + '_tp_zone';
        if (annotations[tpZoneKey]) {
            annotations[tpZoneKey].yMin = tpMinY;
            annotations[tpZoneKey].yMax = tpMaxY;
        }
        
        // Update Stop Loss zone
        const slMinY = Math.min(tpsl.entry.y, tpsl.stopLoss.y);
        const slMaxY = Math.max(tpsl.entry.y, tpsl.stopLoss.y);
        const slZoneKey = tpsl.id + '_sl_zone';
        if (annotations[slZoneKey]) {
            annotations[slZoneKey].yMin = slMinY;
            annotations[slZoneKey].yMax = slMaxY;
        }
        
        // Update line labels to show new prices
        const entryKey = tpsl.id + '_entry';
        const tpKey = tpsl.id + '_tp';
        const slKey = tpsl.id + '_sl';
        
        if (annotations[entryKey] && annotations[entryKey].label) {
            annotations[entryKey].label.content = `Entry: $${tpsl.entry.y.toFixed(2)}`;
        }
        if (annotations[tpKey] && annotations[tpKey].label) {
            annotations[tpKey].label.content = `TP: $${tpsl.takeProfit.y.toFixed(2)}`;
        }
        if (annotations[slKey] && annotations[slKey].label) {
            annotations[slKey].label.content = `SL: $${tpsl.stopLoss.y.toFixed(2)}`;
        }
        
        showInfo(`TP/SL ${fullId.includes('_entry') ? 'Entry' : fullId.includes('_tp') ? 'Take Profit' : 'Stop Loss'} updated. New R:R ${tpsl.riskReward}:1`);
    }
}

// Finalize drag operation
function finalizeDrag() {
    isDragging = false;
    dragTarget = null;
    dragStartPosition = null;
    
    // Reset cursor
    if (stockChart && stockChart.canvas) {
        stockChart.canvas.style.cursor = 'default';
    }
    
    // Auto-save annotations after position change
    if (window.currentSymbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
    
    showInfo('Element position updated successfully!');
}

// Setup keyboard event listeners
function setupKeyboardEventListeners() {
    document.addEventListener('keydown', (event) => {
        // Delete key functionality
        if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotation) {
            event.preventDefault();
            deleteSelectedAnnotation();
        }
        
        // Escape key to deselect
        if (event.key === 'Escape') {
            deselectAnnotation();
        }
    });
}

// Select annotation (called when clicking on an annotation)
function selectAnnotation(annotationId, annotationType) {
    // Deselect previous annotation
    deselectAnnotation();
    
    selectedAnnotation = {
        id: annotationId,
        type: annotationType,
        baseId: getBaseAnnotationId(annotationId)
    };
    
    // Visual feedback for selection
    highlightSelectedAnnotation();
    showInfo(`Selected ${annotationType}. Press Delete to remove, Escape to deselect.`);
}

// Deselect current annotation
function deselectAnnotation() {
    if (selectedAnnotation) {
        removeAnnotationHighlight();
        selectedAnnotation = null;
    }
}

// Highlight selected annotation
function highlightSelectedAnnotation() {
    if (!selectedAnnotation || !stockChart) return;
    
    const annotations = stockChart.options.plugins.annotation.annotations;
    const annotation = annotations[selectedAnnotation.id];
    
    if (annotation) {
        // Store original border properties
        annotation._originalBorderWidth = annotation.borderWidth;
        annotation._originalBorderColor = annotation.borderColor;
        
        // Apply selection highlight
        if (annotation.type === 'point') {
            annotation.borderWidth = 4;
            annotation.borderColor = '#FFD700'; // Gold color for selection
        } else if (annotation.type === 'box') {
            annotation.borderWidth = 3;
            annotation.borderColor = '#FFD700';
        } else if (annotation.type === 'line') {
            annotation.borderWidth = (annotation.borderWidth || 2) + 2;
            annotation.borderColor = '#FFD700';
        }
        
        stockChart.update('none');
    }
}

// Remove annotation highlight
function removeAnnotationHighlight() {
    if (!selectedAnnotation || !stockChart) return;
    
    const annotations = stockChart.options.plugins.annotation.annotations;
    const annotation = annotations[selectedAnnotation.id];
    
    if (annotation && annotation._originalBorderWidth !== undefined) {
        // Restore original border properties
        annotation.borderWidth = annotation._originalBorderWidth;
        annotation.borderColor = annotation._originalBorderColor;
        
        // Clean up stored properties
        delete annotation._originalBorderWidth;
        delete annotation._originalBorderColor;
        
        stockChart.update('none');
    }
}

// Delete selected annotation
function deleteSelectedAnnotation() {
    if (!selectedAnnotation || !stockChart) return;
    
    const baseId = selectedAnnotation.baseId;
    const annotations = stockChart.options.plugins.annotation.annotations;
    
    // Remove from chart annotations
    if (selectedAnnotation.type === 'note') {
        // Remove note
        delete annotations[baseId];
        
        // Remove from stored data
        chartAnnotations.notes = chartAnnotations.notes.filter(note => note.id !== baseId);
        
        // Remove from note data
        if (stockChart.noteData && stockChart.noteData[baseId]) {
            delete stockChart.noteData[baseId];
        }
        
        showInfo('Note deleted successfully.');
        
    } else if (selectedAnnotation.type === 'signal') {
        // Remove signal and its label
        delete annotations[baseId];
        delete annotations[baseId + '_label'];
        
        // Remove from stored data
        chartAnnotations.signals = chartAnnotations.signals.filter(signal => signal.id !== baseId);
        
        showInfo('Signal deleted successfully.');
        
    } else if (selectedAnnotation.type === 'tpsl_group' || baseId.startsWith('tpsl_')) {
        // Remove entire TPSL setup
        Object.keys(annotations).forEach(key => {
            if (key.startsWith(baseId)) {
                delete annotations[key];
            }
        });
        
        // Remove from stored data
        chartAnnotations.tpsl = chartAnnotations.tpsl.filter(tpsl => tpsl.id !== baseId);
        
        showInfo('TP/SL setup deleted successfully.');
        
    } else if (selectedAnnotation.type === 'line') {
        // Remove trend line
        delete annotations[baseId];
        
        // Remove from stored data
        chartAnnotations.lines = chartAnnotations.lines.filter(line => line.id !== baseId);
        
        showInfo('Line deleted successfully.');
    }
    
    stockChart.update('none');
    selectedAnnotation = null;
    
    // Auto-save annotations after deletion
    if (window.currentSymbol) {
        saveAnnotationsToStorage(window.currentSymbol);
    }
}

// Handle candle hover for OHLC tooltip
function handleCandleHover(event) {
    if (!stockChart || !stockChart.candlestickData) return;
    
    const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
    const dataX = stockChart.scales.x.getValueForPixel(canvasPosition.x);
    
    // Find the closest candle
    let closestCandle = null;
    let minDistance = Infinity;
    
    stockChart.candlestickData.forEach(candle => {
        const distance = Math.abs(candle.x.getTime() - dataX);
        if (distance < minDistance) {
            minDistance = distance;
            closestCandle = candle;
        }
    });
    
    if (closestCandle && minDistance < 86400000) { // Within 1 day
        showCandleTooltip(event, closestCandle);
    } else {
        hideCandleTooltip();
    }
}

// Show candle tooltip with OHLC data
function showCandleTooltip(event, candleData) {
    let tooltip = document.getElementById('candle-tooltip');
    
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'candle-tooltip';
        tooltip.className = 'candle-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            z-index: 10000;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            border: 2px solid ${candleData.change >= 0 ? '#22c55e' : '#ef4444'};
            min-width: 180px;
        `;
        document.body.appendChild(tooltip);
    }
    
    const isUp = candleData.change >= 0;
    const candleColor = isUp ? '#22c55e' : '#ef4444';
    const changePercent = candleData.open !== 0 ? ((candleData.change / candleData.open) * 100).toFixed(2) : '0.00';
    const changeSymbol = candleData.change >= 0 ? '+' : '';
    
    tooltip.style.borderColor = candleColor;
    
    tooltip.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: ${candleColor}; text-align: center;">
            ${isUp ? '🟢' : '🔴'} ${candleData.x.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
            <div style="color: #a1a1aa;">Open:</div>
            <div style="font-weight: bold;">$${candleData.open.toFixed(2)}</div>
            
            <div style="color: #a1a1aa;">High:</div>
            <div style="font-weight: bold; color: #22c55e;">$${candleData.high.toFixed(2)}</div>
            
            <div style="color: #a1a1aa;">Low:</div>
            <div style="font-weight: bold; color: #ef4444;">$${candleData.low.toFixed(2)}</div>
            
            <div style="color: #a1a1aa;">Close:</div>
            <div style="font-weight: bold;">$${candleData.close.toFixed(2)}</div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #374151;">
            <div style="font-size: 11px; color: #a1a1aa;">Change:</div>
            <div style="font-weight: bold; color: ${candleColor};">
                ${changeSymbol}$${candleData.change.toFixed(2)} (${changeSymbol}${changePercent}%)
            </div>
        </div>
        ${candleData.volume ? `
        <div style="margin-top: 4px;">
            <div style="font-size: 11px; color: #a1a1aa;">Volume:</div>
            <div style="font-weight: bold; color: #6b7280;">${formatVolume(candleData.volume)}</div>
        </div>
        ` : ''}
    `;
    
    // Position tooltip near mouse
    const rect = stockChart.canvas.getBoundingClientRect();
    const tooltipX = rect.left + event.clientX - rect.left + 15;
    const tooltipY = rect.top + event.clientY - rect.top - 50;
    
    // Adjust position if tooltip would go off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipX + tooltipRect.width > window.innerWidth) {
        tooltip.style.left = (tooltipX - tooltipRect.width - 30) + 'px';
    } else {
        tooltip.style.left = tooltipX + 'px';
    }
    
    if (tooltipY < 0) {
        tooltip.style.top = (tooltipY + 100) + 'px';
    } else {
        tooltip.style.top = tooltipY + 'px';
    }
    
    tooltip.style.display = 'block';
}

// Hide candle tooltip
function hideCandleTooltip() {
    const tooltip = document.getElementById('candle-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}
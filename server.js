import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// 添加一个缓存对象，用于存储获取到的最长历史数据
const stockDataCache = {};

// 加载模拟财务数据
let mockFinancialData = {};
try {
    const mockDataPath = path.join(__dirname, 'mockData', 'fundamentalData.json');
    if (fs.existsSync(mockDataPath)) {
        const mockDataRaw = fs.readFileSync(mockDataPath, 'utf8');
        mockFinancialData = JSON.parse(mockDataRaw);
        console.log('Mock fundamental data loaded successfully');
    } else {
        console.warn('Mock data file not found at:', mockDataPath);
    }
} catch (error) {
    console.error('Error loading mock fundamental data:', error);
}

// 直接实现FundamentalData的功能，而不是导入模块
async function getFundamentalData(symbol) {
    console.log(`Getting fundamental data for ${symbol}...`);
    
    // 检查是否有模拟数据可用
    if (mockFinancialData && mockFinancialData[symbol]) {
        console.log(`Using mock fundamental data for ${symbol}`);
        return mockFinancialData[symbol];
    }
    
    try {
        // 仍然从Yahoo获取一些基本公司信息
        const quote = await yahooFinance.quote(symbol);
        const summary = await yahooFinance.quoteSummary(symbol, { 
            modules: ['assetProfile', 'summaryDetail']
        });
        
        const profile = summary.assetProfile || {};
        const detail = summary.summaryDetail || {};
        
        // 组合模拟财务数据和实际公司信息
        return {
            company_info: {
                name: quote.longName || quote.shortName || symbol,
                sector: profile.sector || quote.sector || 'Technology',
                industry: profile.industry || quote.industry || 'Technology',
                country: profile.country || quote.country || 'United States',
                website: profile.website || 'https://www.example.com',
                description: profile.longBusinessSummary || quote.longBusinessSummary || `${symbol} is a publicly traded company.`,
                market_cap: quote.marketCap || 0,
                pe_ratio: quote.trailingPE || (detail.trailingPE && detail.trailingPE.raw) || 0,
                pb_ratio: quote.priceToBook || (detail.priceToBook && detail.priceToBook.raw) || 0,
                dividend_yield: quote.dividendYield || (detail.dividendYield && detail.dividendYield.raw) || 0,
                beta: quote.beta || (detail.beta && detail.beta.raw) || 1.0
            },
            financials: {},
            analyst_recommendations: {
                firm: 'Analyst Consensus',
                to_grade: 'Buy',
                from_grade: 'Hold',
                action: 'Upgrade',
                date: new Date().toISOString().split('T')[0]
            },
            dividends: {
                last_dividend: detail.dividendRate && detail.dividendRate.raw ? detail.dividendRate.raw : 0.24,
                last_dividend_date: detail.exDividendDate && detail.exDividendDate.fmt ? detail.exDividendDate.fmt : 'N/A',
                dividend_frequency: detail.dividendYield && detail.dividendYield.raw ? 'Annual' : 'None'
            }
        };
    } catch (error) {
        console.warn(`Error fetching additional company data for ${symbol}:`, error);
        
        // 如果API调用失败，仍然返回模拟财务数据和基本公司信息
        return {
            company_info: {
                name: symbol,
                sector: 'Technology',
                industry: 'Technology',
                country: 'United States',
                website: 'https://www.example.com',
                description: `${symbol} is a publicly traded company.`,
                market_cap: 0,
                pe_ratio: 0,
                pb_ratio: 0,
                dividend_yield: 0,
                beta: 1.0
            },
            financials: {},
            analyst_recommendations: {
                firm: 'Analyst Consensus',
                to_grade: 'Buy',
                from_grade: 'Hold',
                action: 'Upgrade',
                date: new Date().toISOString().split('T')[0]
            },
            dividends: {
                last_dividend: 0.24,
                last_dividend_date: 'N/A',
                dividend_frequency: 'None'
            }
        };
    }
}

// Fundamental data API
app.get('/api/fundamental', async (req, res) => {
    const symbol = req.query.symbol;
    if (!symbol) {
        return res.status(400).json({ 
            error: 'Missing symbol parameter',
            message: 'Stock symbol is required'
        });
    }
    
    console.log(`API request for fundamental data: ${symbol}`);
    
    try {
        const data = await getFundamentalData(symbol);
        console.log(`Successfully returned fundamental data for ${symbol}`);
        res.json(data);
    } catch (err) {
        console.error(`API error for ${symbol}:`, err);
        res.status(500).json({ 
            error: 'Failed to fetch fundamental data', 
            message: err.message,
            symbol: symbol
        });
    }
});

// Helper function to determine start date based on period
function getStartDateForPeriod(period) {
    const now = new Date();
    switch (period) {
        case '1w': 
            // 获取最近52周的数据
            return new Date(now.setFullYear(now.getFullYear() - 1));
        case '1mo': 
            // 获取最近24个月的数据
            return new Date(now.setFullYear(now.getFullYear() - 2));
        default: 
            return new Date(now.setFullYear(now.getFullYear() - 1));
    }
}

// 根据时间段对数据进行聚合
function aggregateDataByPeriod(data, period) {
    if (!data || data.length === 0) return [];

    // 按照日期排序
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (period === '1w') {
        // 按周聚合数据
        const weeklyData = [];
        let currentWeek = null;
        let weekData = [];

        data.forEach(item => {
            const date = new Date(item.date);
            const weekNumber = getWeekNumber(date);

            if (currentWeek === null) {
                currentWeek = weekNumber;
                weekData = [item];
            } else if (weekNumber === currentWeek) {
                weekData.push(item);
            } else {
                if (weekData.length > 0) {
                    weeklyData.push(aggregateWeekData(weekData));
                }
                currentWeek = weekNumber;
                weekData = [item];
            }
        });

        // 添加最后一周的数据
        if (weekData.length > 0) {
            weeklyData.push(aggregateWeekData(weekData));
        }

        return weeklyData;
    } else if (period === '1mo') {
        // 按月聚合数据
        const monthlyData = [];
        let currentMonth = null;
        let monthData = [];

        data.forEach(item => {
            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

            if (currentMonth === null) {
                currentMonth = monthKey;
                monthData = [item];
            } else if (monthKey === currentMonth) {
                monthData.push(item);
            } else {
                if (monthData.length > 0) {
                    monthlyData.push(aggregateMonthData(monthData));
                }
                currentMonth = monthKey;
                monthData = [item];
            }
        });

        // 添加最后一个月的数据
        if (monthData.length > 0) {
            monthlyData.push(aggregateMonthData(monthData));
        }

        return monthlyData;
    }

    return data;
}

// 辅助函数：获取周数
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 辅助函数：聚合周数据
function aggregateWeekData(weekData) {
    const firstDay = new Date(weekData[0].date);
    const lastDay = new Date(weekData[weekData.length - 1].date);
    
    return {
        date: weekData[0].date, // 使用该周第一天的日期
        open: weekData[0].open,
        high: Math.max(...weekData.map(d => d.high)),
        low: Math.min(...weekData.map(d => d.low)),
        close: weekData[weekData.length - 1].close,
        volume: weekData.reduce((sum, d) => sum + d.volume, 0),
        displayDate: `Week ${getWeekNumber(firstDay)} - ${firstDay.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })}`
    };
}

// 辅助函数：聚合月数据
function aggregateMonthData(monthData) {
    const firstDay = new Date(monthData[0].date);
    
    return {
        date: monthData[0].date, // 使用该月第一天的日期
        open: monthData[0].open,
        high: Math.max(...monthData.map(d => d.high)),
        low: Math.min(...monthData.map(d => d.low)),
        close: monthData[monthData.length - 1].close,
        volume: monthData.reduce((sum, d) => sum + d.volume, 0),
        displayDate: firstDay.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    };
}

// Stock historical data API with period support
app.get('/api/stock', async (req, res) => {
    const symbol = req.query.symbol;
    const period = req.query.period || '1mo';
    
    if (!symbol) {
        return res.status(400).json({ error: 'Missing symbol parameter' });
    }
    
    if (!['1w', '1mo'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period. Use 1w or 1mo.' });
    }
    
    try {
        // 检查是否已缓存此股票的最长历史数据
        if (!stockDataCache[symbol]) {
            console.log(`Fetching historical data for ${symbol}`);
            
            const queryOptions = {
                period1: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000), // 2年前
                period2: new Date(), // 当前日期
                interval: '1d' // 使用日间隔
            };
            
            const result = await yahooFinance.historical(symbol, queryOptions);
            if (!result || result.length === 0) {
                throw new Error('No historical data available for this symbol');
            }
            
            console.log(`Got ${result.length} historical data points for ${symbol}`);
            
            // 缓存获取的数据
            stockDataCache[symbol] = result.map(item => ({
                date: item.date.toISOString().split('T')[0],
                open: item.open || 0,
                high: item.high || 0,
                low: item.low || 0,
                close: item.close || 0,
                volume: item.volume || 0
            })).filter(item => item.close > 0); // 过滤掉无效数据
        }
        
        // 根据选择的时间段过滤数据
        const startDate = getStartDateForPeriod(period);
        const filteredData = stockDataCache[symbol].filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
        });
        
        if (filteredData.length === 0) {
            throw new Error('No data available for the selected time period');
        }
        
        // 根据时间段对数据进行聚合
        const aggregatedData = aggregateDataByPeriod(filteredData, period);
        
        // 处理数据为前端需要的格式
        const processedData = {
            symbol: symbol,
            historicalData: aggregatedData,
            currentPrice: aggregatedData[aggregatedData.length - 1].close,
            change: 0,
            changePercent: 0,
            interval: period === '1w' ? 'week' : 'month' // 添加interval信息
        };
        
        // 计算价格变化
        if (aggregatedData.length > 1) {
            const latest = aggregatedData[aggregatedData.length - 1];
            const previous = aggregatedData[aggregatedData.length - 2];
            processedData.change = latest.close - previous.close;
            processedData.changePercent = (processedData.change / previous.close) * 100;
        }
        
        res.json(processedData);
    } catch (err) {
        console.error('Error fetching stock data:', err);
        res.status(500).json({ 
            error: err.message || 'Error fetching stock data',
            details: err.toString()
        });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 
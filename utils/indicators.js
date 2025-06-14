import { INDICATORS_CONFIG } from '../config.js';

class TechnicalIndicators {
    // Simple Moving Average
    static calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
                continue;
            }
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        return sma;
    }

    // Exponential Moving Average
    static calculateEMA(prices, period) {
        const ema = new Array(prices.length).fill(null);
        const multiplier = 2 / (period + 1);
        
        // Initialize EMA with SMA
        let smaSum = 0;
        for (let i = 0; i < period; i++) {
            smaSum += prices[i];
        }
        ema[period - 1] = smaSum / period;
        
        // Calculate subsequent EMAs
        for (let i = period; i < prices.length; i++) {
            ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
        }
        
        return ema;
    }

    // Relative Strength Index
    static calculateRSI(prices, period = INDICATORS_CONFIG.RSI.DEFAULT_PERIOD) {
        const rsi = [];
        const gains = [];
        const losses = [];
        
        // Calculate initial price changes and gains/losses
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }
        
        // Calculate first average gain and loss
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        // Calculate initial RSI
        rsi.push(null); // First point has no RSI
        let rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
        
        // Calculate subsequent RSI values using smoothed averages
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;
            
            // Use smoothed moving average
            avgGain = ((avgGain * (period - 1)) + gain) / period;
            avgLoss = ((avgLoss * (period - 1)) + loss) / period;
            
            rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
        
        // Fill initial null values
        const firstValidRSI = rsi.find(v => v !== null);
        return rsi.map(v => v === null ? firstValidRSI : v);
    }

    // MACD
    static calculateMACD(prices, 
                        fastPeriod = INDICATORS_CONFIG.MACD.FAST_PERIOD,
                        slowPeriod = INDICATORS_CONFIG.MACD.SLOW_PERIOD,
                        signalPeriod = INDICATORS_CONFIG.MACD.SIGNAL_PERIOD) {
        // Calculate EMAs
        const fastEMA = this.calculateEMA(prices, fastPeriod);
        const slowEMA = this.calculateEMA(prices, slowPeriod);
        
        // Calculate MACD line
        const macdLine = new Array(prices.length).fill(null);
        for (let i = slowPeriod - 1; i < prices.length; i++) {
            if (fastEMA[i] !== null && slowEMA[i] !== null) {
                macdLine[i] = fastEMA[i] - slowEMA[i];
            }
        }
        
        // Calculate signal line (EMA of MACD line)
        const validMacdStart = macdLine.findIndex(v => v !== null);
        const validMacdLine = macdLine.slice(validMacdStart);
        const signalLine = new Array(validMacdStart).fill(null).concat(
            this.calculateEMA(validMacdLine, signalPeriod)
        );
        
        // Calculate histogram
        const histogram = macdLine.map((macd, i) => {
            if (macd === null || signalLine[i] === null) return null;
            return macd - signalLine[i];
        });
        
        // Fill initial values
        const firstValidMACD = macdLine.find(v => v !== null);
        const firstValidSignal = signalLine.find(v => v !== null);
        const firstValidHist = histogram.find(v => v !== null);
        
        return {
            macdLine: macdLine.map(v => v === null ? firstValidMACD : v),
            signalLine: signalLine.map(v => v === null ? firstValidSignal : v),
            histogram: histogram.map(v => v === null ? firstValidHist : v)
        };
    }

    // Bollinger Bands
    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const upperBand = [];
        const middleBand = [];
        const lowerBand = [];
        
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                upperBand.push(null);
                middleBand.push(null);
                lowerBand.push(null);
                continue;
            }
            
            const slice = prices.slice(i - period + 1, i + 1);
            const sma = slice.reduce((a, b) => a + b, 0) / period;
            const variance = slice.reduce((a, b) => a + Math.pow(b - sma, 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);
            
            middleBand.push(sma);
            upperBand.push(sma + (standardDeviation * stdDev));
            lowerBand.push(sma - (standardDeviation * stdDev));
        }
        
        return {
            upperBand,
            middleBand,
            lowerBand
        };
    }

    // Volume Profile
    static calculateVolumeProfile(prices, volumes, numBins = 20) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const binSize = (maxPrice - minPrice) / numBins;
        
        const bins = new Array(numBins).fill(0);
        const binPrices = new Array(numBins).fill(0);
        
        // Initialize bin prices
        for (let i = 0; i < numBins; i++) {
            binPrices[i] = minPrice + (i + 0.5) * binSize;
        }
        
        // Distribute volumes into bins
        prices.forEach((price, i) => {
            const binIndex = Math.min(Math.floor((price - minPrice) / binSize), numBins - 1);
            bins[binIndex] += volumes[i];
        });
        
        return {
            prices: binPrices,
            volumes: bins
        };
    }

    // Volume Moving Average
    static calculateVolumeMA(volumes, period = 20) {
        if (!volumes || volumes.length === 0) return [];
        
        const result = new Array(volumes.length).fill(null);
        
        for (let i = period - 1; i < volumes.length; i++) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += volumes[j] || 0;
            }
            result[i] = sum / period;
        }
        
        return result;
    }

    // On Balance Volume (OBV)
    static calculateOBV(prices, volumes) {
        if (!prices || !volumes || prices.length !== volumes.length) return [];
        
        const obv = new Array(prices.length).fill(0);
        obv[0] = volumes[0] || 0;
        
        for (let i = 1; i < prices.length; i++) {
            const currentPrice = prices[i];
            const previousPrice = prices[i - 1];
            const currentVolume = volumes[i] || 0;
            
            if (currentPrice > previousPrice) {
                obv[i] = obv[i - 1] + currentVolume;
            } else if (currentPrice < previousPrice) {
                obv[i] = obv[i - 1] - currentVolume;
            } else {
                obv[i] = obv[i - 1];
            }
        }
        
        return obv;
    }

    // Volume Rate of Change
    static calculateVROC(volumes, period = 14) {
        if (!volumes || volumes.length < period + 1) return [];
        
        const result = new Array(volumes.length).fill(null);
        
        for (let i = period; i < volumes.length; i++) {
            const currentVolume = volumes[i] || 0;
            const pastVolume = volumes[i - period] || 0;
            
            if (pastVolume !== 0) {
                result[i] = ((currentVolume - pastVolume) / pastVolume) * 100;
            }
        }
        
        return result;
    }

    // Stochastic Oscillator
    static calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
        const stochK = [];
        const stochD = [];
        
        // Calculate %K values
        for (let i = 0; i < closes.length; i++) {
            if (i < kPeriod - 1) {
                stochK.push(null);
                continue;
            }
            
            const periodHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
            const periodLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
            const currentClose = closes[i];
            
            if (periodHigh === periodLow) {
                stochK.push(50); // Default to middle when no range
            } else {
                const kValue = ((currentClose - periodLow) / (periodHigh - periodLow)) * 100;
                stochK.push(kValue);
            }
        }
        
        // Calculate %D (SMA of %K)
        for (let i = 0; i < stochK.length; i++) {
            if (i < dPeriod - 1 || stochK[i] === null) {
                stochD.push(null);
                continue;
            }
            
            const validKValues = stochK.slice(i - dPeriod + 1, i + 1)
                .filter(v => v !== null);
            
            if (validKValues.length === dPeriod) {
                const dValue = validKValues.reduce((sum, val) => sum + val, 0) / dPeriod;
                stochD.push(dValue);
            } else {
                stochD.push(null);
            }
        }
        
        return {
            stochK: stochK.map(v => v === null ? 50 : v),
            stochD: stochD.map(v => v === null ? 50 : v)
        };
    }
}

export default TechnicalIndicators; 
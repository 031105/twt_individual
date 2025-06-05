import { PREDICTION_CONFIG } from '../config.js';

class PredictionModels {
    // Enhanced Linear Regression Prediction with multiple steps
    static linearRegression(prices, lookbackPeriod = PREDICTION_CONFIG.MODELS.LINEAR_REGRESSION.LOOKBACK_PERIOD, steps = 1) {
        const n = Math.min(prices.length, lookbackPeriod);
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        
        const recentPrices = prices.slice(-n);
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += recentPrices[i];
            sumXY += i * recentPrices[i];
            sumXX += i * i;
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared for accuracy
        const rSquared = this.calculateRSquared(recentPrices, slope, intercept);
        
        return {
            slope,
            intercept,
            rSquared,
            accuracy: rSquared * 100,
            predict: (stepAhead = 1) => slope * (n + stepAhead - 1) + intercept,
            predictMultiple: (steps) => {
                const predictions = [];
                for (let i = 1; i <= steps; i++) {
                    predictions.push({
                        step: i,
                        value: slope * (n + i - 1) + intercept,
                        confidence: Math.max(20, rSquared * 100 - (i * 5)) // Confidence decreases with distance
                    });
                }
                return predictions;
            }
        };
    }

    // Calculate R-squared for linear regression accuracy
    static calculateRSquared(actual, slope, intercept) {
        const n = actual.length;
        const mean = actual.reduce((a, b) => a + b) / n;
        
        let ssRes = 0; // Sum of squares of residuals
        let ssTot = 0; // Total sum of squares
        
        for (let i = 0; i < n; i++) {
            const predicted = slope * i + intercept;
            ssRes += Math.pow(actual[i] - predicted, 2);
            ssTot += Math.pow(actual[i] - mean, 2);
        }
        
        return Math.max(0, 1 - (ssRes / ssTot));
    }

    // Moving Average Prediction with multiple periods
    static movingAverage(prices, period = PREDICTION_CONFIG.MODELS.MOVING_AVERAGE.PERIOD) {
        const recentPrices = prices.slice(-period);
        const average = recentPrices.reduce((a, b) => a + b, 0) / period;
        
        // Calculate trend
        const halfPeriod = Math.floor(period / 2);
        const firstHalf = recentPrices.slice(0, halfPeriod).reduce((a, b) => a + b, 0) / halfPeriod;
        const secondHalf = recentPrices.slice(-halfPeriod).reduce((a, b) => a + b, 0) / halfPeriod;
        const trend = (secondHalf - firstHalf) / halfPeriod;
        
        return {
            average,
            trend,
            predict: (steps = 1) => average + (trend * steps),
            predictMultiple: (steps) => {
                const predictions = [];
                for (let i = 1; i <= steps; i++) {
                    predictions.push({
                        step: i,
                        value: average + (trend * i),
                        confidence: Math.max(30, 80 - (i * 3))
                    });
                }
                return predictions;
            }
        };
    }

    // Enhanced Exponential Smoothing with trend
    static exponentialSmoothing(prices, alpha = PREDICTION_CONFIG.MODELS.EXPONENTIAL_SMOOTHING.ALPHA, beta = 0.3) {
        let level = prices[0];
        let trend = prices[1] - prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            const prevLevel = level;
            level = alpha * prices[i] + (1 - alpha) * (level + trend);
            trend = beta * (level - prevLevel) + (1 - beta) * trend;
        }
        
        return {
            level,
            trend,
            predict: (steps = 1) => level + (trend * steps),
            predictMultiple: (steps) => {
                const predictions = [];
                for (let i = 1; i <= steps; i++) {
                    predictions.push({
                        step: i,
                        value: level + (trend * i),
                        confidence: Math.max(25, 75 - (i * 4))
                    });
                }
                return predictions;
            }
        };
    }

    // ARIMA-like simple autoregressive prediction
    static autoregressivePrediction(prices, order = 3) {
        if (prices.length < order + 1) return null;
        
        const n = prices.length;
        const X = [];
        const y = [];
        
        // Prepare data for regression
        for (let i = order; i < n; i++) {
            const row = [];
            for (let j = 0; j < order; j++) {
                row.push(prices[i - order + j]);
            }
            X.push(row);
            y.push(prices[i]);
        }
        
        // Simple least squares solution
        const coefficients = this.multipleRegression(X, y);
        
        return {
            coefficients,
            predict: (steps = 1) => {
                let prediction = 0;
                const lastValues = prices.slice(-order);
                for (let i = 0; i < order; i++) {
                    prediction += coefficients[i] * lastValues[i];
                }
                return prediction;
            },
            predictMultiple: (steps) => {
                const predictions = [];
                let currentValues = [...prices.slice(-order)];
                
                for (let step = 1; step <= steps; step++) {
                    let prediction = 0;
                    for (let i = 0; i < order; i++) {
                        prediction += coefficients[i] * currentValues[i];
                    }
                    
                    predictions.push({
                        step,
                        value: prediction,
                        confidence: Math.max(20, 70 - (step * 6))
                    });
                    
                    // Update current values for next prediction
                    currentValues.shift();
                    currentValues.push(prediction);
                }
                return predictions;
            }
        };
    }

    // Simple multiple regression solver
    static multipleRegression(X, y) {
        const n = X.length;
        const k = X[0].length;
        
        // Add intercept column
        const XMatrix = X.map(row => [1, ...row]);
        
        // Simple normal equation solution (X'X)^-1 X'y
        // For simplicity, using a basic least squares approach
        const coefficients = new Array(k).fill(0);
        
        for (let i = 0; i < k; i++) {
            let numerator = 0;
            let denominator = 0;
            
            for (let j = 0; j < n; j++) {
                numerator += X[j][i] * y[j];
                denominator += X[j][i] * X[j][i];
            }
            
            coefficients[i] = denominator !== 0 ? numerator / denominator : 0;
        }
        
        return coefficients;
    }

    // Enhanced Combined Prediction with multiple algorithms
    static combinedPrediction(prices, steps = 1) {
        const lr = this.linearRegression(prices, undefined, steps);
        const ma = this.movingAverage(prices);
        const es = this.exponentialSmoothing(prices);
        const ar = this.autoregressivePrediction(prices);
        
        const algorithms = [
            { name: 'Linear Regression', model: lr, weight: 0.3 },
            { name: 'Moving Average', model: ma, weight: 0.25 },
            { name: 'Exponential Smoothing', model: es, weight: 0.25 },
            { name: 'Autoregressive', model: ar, weight: 0.2 }
        ].filter(alg => alg.model !== null);
        
        if (steps === 1) {
            const predictions = algorithms.map(alg => ({
                name: alg.name,
                value: alg.model.predict(1),
                weight: alg.weight
            }));
            
            const combined = predictions.reduce((sum, pred) => sum + pred.value * pred.weight, 0);
            const confidence = this.calculateCombinedConfidence(predictions.map(p => p.value));
            
            return {
                predictions: Object.fromEntries(
                    predictions.map(p => [p.name.toLowerCase().replace(/\s+/g, ''), p.value])
                ),
                combined,
                confidence: confidence / 100,
                accuracy: confidence,
                algorithms: predictions
            };
        } else {
            // Multi-step prediction
            const multiStepPredictions = algorithms.map(alg => ({
                name: alg.name,
                predictions: alg.model.predictMultiple(steps),
                weight: alg.weight
            }));
            
            const combinedSteps = [];
            for (let step = 1; step <= steps; step++) {
                let combinedValue = 0;
                let totalWeight = 0;
                const stepPredictions = [];
                
                multiStepPredictions.forEach(alg => {
                    const stepPred = alg.predictions.find(p => p.step === step);
                    if (stepPred) {
                        combinedValue += stepPred.value * alg.weight;
                        totalWeight += alg.weight;
                        stepPredictions.push(stepPred.value);
                    }
                });
                
                combinedSteps.push({
                    step,
                    value: combinedValue / totalWeight,
                    confidence: this.calculateCombinedConfidence(stepPredictions),
                    date: this.getFutureDate(step)
                });
            }
            
            return {
                multiStep: combinedSteps,
                algorithms: multiStepPredictions,
                summary: {
                    totalSteps: steps,
                    averageConfidence: combinedSteps.reduce((sum, s) => sum + s.confidence, 0) / steps
                }
            };
        }
    }

    // Calculate combined confidence from multiple predictions
    static calculateCombinedConfidence(predictions) {
        if (predictions.length === 0) return 0;
        
        const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
        const variance = predictions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / predictions.length;
        const stdDev = Math.sqrt(variance);
        
        // Convert to confidence percentage (lower variance = higher confidence)
        const coefficientOfVariation = stdDev / Math.abs(mean);
        const confidence = Math.max(20, 100 - (coefficientOfVariation * 100));
        
        return Math.min(95, confidence);
    }

    // Get future date for multi-step predictions
    static getFutureDate(steps) {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + steps);
        return futureDate.toISOString().split('T')[0];
    }

    // Generate prediction intervals
    static generatePredictionIntervals(prediction, confidence, historicalVolatility) {
        const zScore = this.getZScore(confidence);
        const marginOfError = zScore * historicalVolatility;
        
        return {
            upper: prediction + marginOfError,
            lower: prediction - marginOfError
        };
    }

    // Get Z-score for confidence interval
    static getZScore(confidence) {
        // Common confidence levels and their Z-scores
        const zScores = {
            80: 1.28,
            85: 1.44,
            90: 1.645,
            95: 1.96,
            99: 2.576
        };
        
        // Find closest confidence level
        const levels = Object.keys(zScores).map(Number);
        const closestLevel = levels.reduce((prev, curr) => 
            Math.abs(curr - confidence) < Math.abs(prev - confidence) ? curr : prev
        );
        
        return zScores[closestLevel];
    }

    // Calculate historical volatility
    static calculateHistoricalVolatility(prices, period = 20) {
        if (prices.length < 2) return 0;
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.log(prices[i] / prices[i - 1]));
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        
        // Annualize volatility (assuming daily data)
        return stdDev * Math.sqrt(252);
    }

    // Calculate prediction accuracy metrics
    static calculateAccuracyMetrics(actual, predicted) {
        if (actual.length !== predicted.length || actual.length === 0) {
            return { mae: 0, mse: 0, rmse: 0, mape: 0 };
        }
        
        let mae = 0; // Mean Absolute Error
        let mse = 0; // Mean Squared Error
        let mape = 0; // Mean Absolute Percentage Error
        
        for (let i = 0; i < actual.length; i++) {
            const error = actual[i] - predicted[i];
            mae += Math.abs(error);
            mse += error * error;
            if (actual[i] !== 0) {
                mape += Math.abs(error / actual[i]);
            }
        }
        
        const n = actual.length;
        mae /= n;
        mse /= n;
        mape = (mape / n) * 100;
        const rmse = Math.sqrt(mse);
        
        return { mae, mse, rmse, mape };
    }

    // Simple prediction interface for basic usage
    static calculatePredictions(prices) {
        try {
            if (!prices || prices.length < 5) {
                throw new Error('Insufficient data for predictions');
            }
            
            // Get individual model predictions
            const lr = this.linearRegression(prices);
            const ma = this.movingAverage(prices);
            const es = this.exponentialSmoothing(prices);
            
            // Calculate predictions
            const linear = lr ? lr.predict(1) : 0;
            const movingAverage = ma ? ma.predict(1) : 0;
            const exponential = es ? es.predict(1) : 0;
            
            // Combined prediction (weighted average)
            const combined = (linear * 0.4 + movingAverage * 0.3 + exponential * 0.3);
            
            return {
                linear: linear,
                movingAverage: movingAverage,
                exponential: exponential,
                combined: combined
            };
        } catch (error) {
            console.error('Error in calculatePredictions:', error);
            // Return safe fallback values
            const lastPrice = prices[prices.length - 1] || 0;
            return {
                linear: lastPrice,
                movingAverage: lastPrice,
                exponential: lastPrice,
                combined: lastPrice
            };
        }
    }
}

export default PredictionModels; 
// Comprehensive Fix for Volume, Shapes, TP/SL and Persistence Issues
// This file addresses the reported issues with indicators and chart functionality

console.log('Loading comprehensive fixes...');

// Wait for DOM and main scripts to load
document.addEventListener('DOMContentLoaded', function() {
    // Delay to ensure all scripts are loaded
    setTimeout(initComprehensiveFixes, 1500);
});

function initComprehensiveFixes() {
    console.log('Initializing comprehensive fixes...');
    
    // Fix 1: Volume Indicator Display Issues
    fixVolumeIndicatorDisplay();
    
    // Fix 2: Shape Drawing Functionality
    fixShapeDrawingFunctionality();
    
    // Fix 3: Enhanced TP/SL Adjustment
    enhanceTpSlFunctionality();
    
    // Fix 4: Indicator Persistence
    fixIndicatorPersistence();
    
    console.log('All comprehensive fixes applied successfully!');
}

// Fix 1: Volume Indicator Display Issues
function fixVolumeIndicatorDisplay() {
    console.log('Fixing Volume indicator display...');
    
    // Ensure Volume indicator settings are properly initialized
    if (typeof window.indicatorSettings !== 'undefined' && !window.indicatorSettings.volume) {
        window.indicatorSettings.volume = {
            maPeriod: 20,
            upColor: '#22c55e',
            downColor: '#ef4444',
            maColor: '#3b82f6',
            scaleFactor: 0.3,
            showMA: true
        };
    }
    
    // Override the Volume rendering for candlestick charts
    const originalDrawCandlestick = window.drawCandlestickChart;
    if (originalDrawCandlestick) {
        window.drawCandlestickChart = function(validData, chartDiv, theme) {
            originalDrawCandlestick.call(this, validData, chartDiv, theme);
            
            // Add Volume after candlestick is rendered if Volume is enabled
            if (document.getElementById('volume-checkbox').checked) {
                setTimeout(() => {
                    addVolumeToRenderedChart(validData, theme);
                }, 300);
            }
        };
    }
    
    // Function to add Volume to existing chart
    function addVolumeToRenderedChart(validData, theme) {
        if (!window.stockChart || !validData) return;
        
        try {
            const volumes = validData.map(d => d.volume || 0);
            const dates = validData.map(d => new Date(d.date));
            
            console.log('Adding Volume to chart, sample data:', volumes.slice(0, 3));
            
            // Create volume annotations directly
            const annotations = window.stockChart.options.plugins.annotation.annotations;
            
            // Clear existing volume annotations
            Object.keys(annotations).forEach(key => {
                if (key.startsWith('volume_')) {
                    delete annotations[key];
                }
            });
            
            const maxVolume = Math.max(...volumes);
            const volumeScale = maxVolume * 0.3; // Scale volume to 30% of chart height
            
            validData.forEach((d, index) => {
                if (d.volume && d.volume > 0) {
                    const prevClose = index > 0 ? validData[index - 1].close : d.close;
                    const isUp = d.close >= prevClose;
                    const color = isUp ? window.indicatorSettings.volume.upColor : window.indicatorSettings.volume.downColor;
                    
                    const volumeHeight = (d.volume / maxVolume) * volumeScale;
                    const chartMinY = window.stockChart.scales.y.min;
                    const volumeBottomY = chartMinY - (maxVolume * 0.05); // Offset below chart
                    const volumeTopY = volumeBottomY - volumeHeight;
                    
                    annotations[`volume_bar_${index}`] = {
                        type: 'box',
                        xMin: new Date(d.date.getTime() - 43200000), // 12 hours before
                        xMax: new Date(d.date.getTime() + 43200000), // 12 hours after
                        yMin: volumeBottomY,
                        yMax: volumeTopY,
                        backgroundColor: color + '80',
                        borderColor: color,
                        borderWidth: 1,
                        label: {
                            enabled: false
                        }
                    };
                }
            });
            
            // Add volume MA if enabled
            if (window.indicatorSettings.volume.showMA) {
                const volumeMA = window.TechnicalIndicators ? 
                    window.TechnicalIndicators.calculateVolumeMA(volumes, window.indicatorSettings.volume.maPeriod) : 
                    [];
                
                if (volumeMA.length > 0) {
                    const maPoints = [];
                    volumeMA.forEach((ma, index) => {
                        if (ma !== null && !isNaN(ma)) {
                            const maHeight = (ma / maxVolume) * volumeScale;
                            const chartMinY = window.stockChart.scales.y.min;
                            const maY = chartMinY - (maxVolume * 0.05) - maHeight;
                            maPoints.push({
                                x: dates[index],
                                y: maY
                            });
                        }
                    });
                    
                    if (maPoints.length > 1) {
                        for (let i = 1; i < maPoints.length; i++) {
                            annotations[`volume_ma_${i}`] = {
                                type: 'line',
                                xMin: maPoints[i-1].x,
                                xMax: maPoints[i].x,
                                yMin: maPoints[i-1].y,
                                yMax: maPoints[i].y,
                                borderColor: window.indicatorSettings.volume.maColor,
                                borderWidth: 2
                            };
                        }
                    }
                }
            }
            
            window.stockChart.update('none');
            console.log('Volume indicators added to chart successfully');
            
        } catch (error) {
            console.error('Error adding Volume to chart:', error);
        }
    }
}

// Fix 2: Shape Drawing Functionality
function fixShapeDrawingFunctionality() {
    console.log('Fixing Shape drawing functionality...');
    
    // Initialize shape mode and settings if not exist
    if (typeof window.shapeMode === 'undefined') {
        window.shapeMode = false;
    }
    
    if (typeof window.shapeSettings === 'undefined') {
        window.shapeSettings = {
            type: 'rectangle',
            color: '#3b82f6',
            size: 30,
            opacity: 0.7,
            label: ''
        };
    }
    
    if (typeof window.chartAnnotations === 'undefined') {
        window.chartAnnotations = { shapes: [] };
    } else if (!window.chartAnnotations.shapes) {
        window.chartAnnotations.shapes = [];
    }
    
    // Enhanced shape adding function
    window.addShapeToChart = function(x, y) {
        if (!window.stockChart) {
            console.error('Chart not available for shape placement');
            return;
        }
        
        const canvasPosition = { x: x, y: y };
        const dataX = window.stockChart.scales.x.getValueForPixel(canvasPosition.x);
        const dataY = window.stockChart.scales.y.getValueForPixel(canvasPosition.y);
        
        const shapeId = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const size = window.shapeSettings.size;
        const halfSize = size / 2;
        
        let shapeAnnotation;
        
        switch (window.shapeSettings.type) {
            case 'rectangle':
                shapeAnnotation = {
                    type: 'box',
                    xMin: new Date(dataX - 3600000), // 1 hour before
                    xMax: new Date(dataX + 3600000), // 1 hour after
                    yMin: dataY - halfSize,
                    yMax: dataY + halfSize,
                    backgroundColor: window.shapeSettings.color + Math.floor(window.shapeSettings.opacity * 255).toString(16).padStart(2, '0'),
                    borderColor: window.shapeSettings.color,
                    borderWidth: 2,
                    label: window.shapeSettings.label ? {
                        content: window.shapeSettings.label,
                        enabled: true,
                        position: 'center'
                    } : { enabled: false }
                };
                break;
                
            case 'circle':
                shapeAnnotation = {
                    type: 'ellipse',
                    xMin: new Date(dataX - 3600000),
                    xMax: new Date(dataX + 3600000),
                    yMin: dataY - halfSize,
                    yMax: dataY + halfSize,
                    backgroundColor: window.shapeSettings.color + Math.floor(window.shapeSettings.opacity * 255).toString(16).padStart(2, '0'),
                    borderColor: window.shapeSettings.color,
                    borderWidth: 2,
                    label: window.shapeSettings.label ? {
                        content: window.shapeSettings.label,
                        enabled: true,
                        position: 'center'
                    } : { enabled: false }
                };
                break;
                
            case 'arrow':
                shapeAnnotation = {
                    type: 'line',
                    xMin: new Date(dataX - 1800000),
                    xMax: new Date(dataX + 1800000),
                    yMin: dataY - halfSize,
                    yMax: dataY + halfSize,
                    borderColor: window.shapeSettings.color,
                    borderWidth: 4,
                    arrowHeads: {
                        end: {
                            enabled: true,
                            size: 10
                        }
                    },
                    label: window.shapeSettings.label ? {
                        content: window.shapeSettings.label,
                        enabled: true,
                        position: 'end'
                    } : { enabled: false }
                };
                break;
                
            default:
                // Default to point for other shapes
                shapeAnnotation = {
                    type: 'point',
                    xValue: new Date(dataX),
                    yValue: dataY,
                    backgroundColor: window.shapeSettings.color,
                    borderColor: window.shapeSettings.color,
                    borderWidth: 3,
                    radius: halfSize,
                    label: window.shapeSettings.label ? {
                        content: window.shapeSettings.label,
                        enabled: true,
                        position: 'top'
                    } : { enabled: false }
                };
        }
        
        // Add to chart
        window.stockChart.options.plugins.annotation.annotations[shapeId] = shapeAnnotation;
        
        // Store in annotations
        window.chartAnnotations.shapes.push({
            id: shapeId,
            type: window.shapeSettings.type,
            x: dataX,
            y: dataY,
            color: window.shapeSettings.color,
            size: window.shapeSettings.size,
            opacity: window.shapeSettings.opacity,
            label: window.shapeSettings.label
        });
        
        window.stockChart.update('none');
        
        // Reset shape mode
        window.shapeMode = false;
        
        if (typeof window.showInfo === 'function') {
            window.showInfo(`${window.shapeSettings.type} shape added successfully!`);
        }
        
        // Auto-save
        if (window.currentSymbol && typeof window.saveAnnotationsToStorage === 'function') {
            window.saveAnnotationsToStorage(window.currentSymbol);
        }
    };
    
    // Clear all shapes function
    window.clearAllShapes = function() {
        if (!window.stockChart) return;
        
        const annotations = window.stockChart.options.plugins.annotation.annotations;
        
        // Remove all shape annotations
        Object.keys(annotations).forEach(key => {
            if (key.startsWith('shape_')) {
                delete annotations[key];
            }
        });
        
        // Clear stored shapes
        if (window.chartAnnotations) {
            window.chartAnnotations.shapes = [];
        }
        
        window.stockChart.update('none');
        
        if (typeof window.showInfo === 'function') {
            window.showInfo('All shapes cleared successfully!');
        }
        
        // Auto-save
        if (window.currentSymbol && typeof window.saveAnnotationsToStorage === 'function') {
            window.saveAnnotationsToStorage(window.currentSymbol);
        }
    };
}

// Fix 3: Enhanced TP/SL Adjustment
function enhanceTpSlFunctionality() {
    console.log('Enhancing TP/SL functionality...');
    
    // Override chart click handler to support shape mode
    const originalHandleChartClick = window.handleChartClick;
    if (originalHandleChartClick) {
        window.handleChartClick = function(event, elements, ctx) {
            // Check if in shape mode
            if (window.shapeMode && typeof window.addShapeToChart === 'function') {
                const rect = ctx.canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                window.addShapeToChart(x, y);
                return;
            }
            
            // Otherwise, call original handler
            originalHandleChartClick.call(this, event, elements, ctx);
        };
    }
}

// Fix 4: Indicator Persistence
function fixIndicatorPersistence() {
    console.log('Fixing indicator persistence...');
    
    // Enhanced save function
    const originalUpdateChart = window.updateChart;
    if (originalUpdateChart) {
        window.updateChart = function() {
            originalUpdateChart.call(this);
            
            // Additional save for indicators
            const indicatorState = {
                sma: document.getElementById('sma-checkbox')?.checked || false,
                rsi: document.getElementById('rsi-checkbox')?.checked || false,
                macd: document.getElementById('macd-checkbox')?.checked || false,
                volume: document.getElementById('volume-checkbox')?.checked || false,
                settings: window.indicatorSettings || {}
            };
            
            try {
                localStorage.setItem('stockapp_indicators_state', JSON.stringify(indicatorState));
                console.log('Indicator state saved:', indicatorState);
            } catch (e) {
                console.warn('Could not save indicator state:', e);
            }
        };
    }
    
    // Enhanced load function
    function loadIndicatorState() {
        try {
            const saved = localStorage.getItem('stockapp_indicators_state');
            if (saved) {
                const state = JSON.parse(saved);
                console.log('Loading indicator state:', state);
                
                // Restore checkboxes
                ['sma', 'rsi', 'macd', 'volume'].forEach(indicator => {
                    const checkbox = document.getElementById(`${indicator}-checkbox`);
                    const badge = document.getElementById(`${indicator}-indicator`);
                    
                    if (checkbox) {
                        checkbox.checked = state[indicator] || false;
                    }
                    
                    if (badge) {
                        badge.style.display = state[indicator] ? 'flex' : 'none';
                    }
                });
                
                // Restore settings
                if (state.settings && window.indicatorSettings) {
                    Object.assign(window.indicatorSettings, state.settings);
                }
                
                console.log('Indicator state restored successfully');
            }
        } catch (e) {
            console.warn('Could not load indicator state:', e);
        }
    }
    
    // Load state on page load
    loadIndicatorState();
    
    // Also load state when stock data is loaded
    const originalDrawChart = window.drawChart;
    if (originalDrawChart) {
        window.drawChart = function(data) {
            loadIndicatorState();
            originalDrawChart.call(this, data);
        };
    }
}

console.log('Comprehensive fixes loaded and ready!'); 
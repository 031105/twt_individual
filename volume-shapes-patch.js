// Volume Indicator and Shape Drawing Functionality Patch
// This file contains enhancements for the stock analysis application

// Volume Settings Event Handlers
document.addEventListener('DOMContentLoaded', function() {
    // Volume Settings
    const saveVolumeBtn = document.getElementById('save-volume-settings');
    
    if (saveVolumeBtn) {
        saveVolumeBtn.addEventListener('click', () => {
            if (typeof indicatorSettings !== 'undefined') {
                indicatorSettings.volume.maPeriod = parseInt(document.getElementById('volume-ma-period').value);
                indicatorSettings.volume.upColor = document.getElementById('volume-up-color').value;
                indicatorSettings.volume.downColor = document.getElementById('volume-down-color').value;
                indicatorSettings.volume.maColor = document.getElementById('volume-ma-color').value;
                indicatorSettings.volume.scaleFactor = parseFloat(document.getElementById('volume-scale').value);
                indicatorSettings.volume.showMA = document.getElementById('volume-show-ma').checked;
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('volumeSettingsModal'));
                modal.hide();
                
                // Update chart if Volume is active
                if (document.getElementById('volume-checkbox').checked) {
                    updateChart();
                }
                
                showInfo('Volume settings updated successfully!');
            }
        });
    }

    // Shape Drawing Event Handlers
    const addShapeBtn = document.getElementById('add-shape-btn');
    const clearShapesBtn = document.getElementById('clear-shapes-btn');
    const shapeColorInput = document.getElementById('shape-color');
    const shapeSizeSelect = document.getElementById('shape-size');
    const shapeOpacitySelect = document.getElementById('shape-opacity');
    const shapeTypeSelect = document.getElementById('shape-type');
    const shapeLabelInput = document.getElementById('shape-label');

    // Update shape settings when controls change
    if (shapeColorInput) {
        shapeColorInput.addEventListener('change', function() {
            if (typeof shapeSettings !== 'undefined') {
                shapeSettings.color = this.value;
            }
        });
    }

    if (shapeSizeSelect) {
        shapeSizeSelect.addEventListener('change', function() {
            if (typeof shapeSettings !== 'undefined') {
                shapeSettings.size = parseInt(this.value);
            }
        });
    }

    if (shapeOpacitySelect) {
        shapeOpacitySelect.addEventListener('change', function() {
            if (typeof shapeSettings !== 'undefined') {
                shapeSettings.opacity = parseFloat(this.value);
            }
        });
    }

    if (shapeTypeSelect) {
        shapeTypeSelect.addEventListener('change', function() {
            if (typeof shapeSettings !== 'undefined') {
                shapeSettings.type = this.value;
            }
        });
    }

    if (shapeLabelInput) {
        shapeLabelInput.addEventListener('change', function() {
            if (typeof shapeSettings !== 'undefined') {
                shapeSettings.label = this.value;
            }
        });
    }

    // Add Shape Button
    if (addShapeBtn) {
        addShapeBtn.addEventListener('click', () => {
            if (typeof stockChart === 'undefined' || !stockChart) {
                showError('Chart not available. Please load stock data first.');
                return;
            }
            
            if (typeof shapeMode !== 'undefined') {
                shapeMode = true;
                showInfo('Click on the chart to add a shape.');
                
                // Close dropdown
                const shapeDropdown = document.getElementById('shape-options');
                const dropdownInstance = bootstrap.Dropdown.getInstance(shapeDropdown);
                if (dropdownInstance) {
                    dropdownInstance.hide();
                }
            }
        });
    }

    // Clear Shapes Button
    if (clearShapesBtn) {
        clearShapesBtn.addEventListener('click', () => {
            clearAllShapes();
        });
    }

    // Add Volume indicator support to existing functions
    if (typeof window.addSelectedIndicator === 'function') {
        const originalAddSelectedIndicator = window.addSelectedIndicator;
        window.addSelectedIndicator = function() {
            const select = document.getElementById('indicator-select');
            const selectedValue = select.value;
            
            if (selectedValue === 'volume') {
                // Update the corresponding checkbox
                const checkbox = document.getElementById('volume-checkbox');
                checkbox.checked = true;
                
                // Show the indicator badge
                const badge = document.getElementById('volume-indicator');
                if (badge) {
                    badge.style.display = 'flex';
                }
                
                // Reset the dropdown
                select.value = '';
                
                showInfo('Volume indicator added. Use settings to customize.');
                
                // Update the chart
                updateChart();
            } else {
                // Call original function for other indicators
                originalAddSelectedIndicator.call(this);
            }
        };
    }

    // Add Volume indicator support to existing removeIndicator function
    if (typeof window.removeIndicator === 'function') {
        const originalRemoveIndicator = window.removeIndicator;
        window.removeIndicator = function(indicator) {
            if (indicator === 'volume') {
                // Update the corresponding checkbox
                const checkbox = document.getElementById('volume-checkbox');
                checkbox.checked = false;
                
                // Hide the indicator badge
                const badge = document.getElementById('volume-indicator');
                if (badge) {
                    badge.style.display = 'none';
                }
                
                // Update the chart
                updateChart();
            } else {
                // Call original function for other indicators
                originalRemoveIndicator.call(this, indicator);
            }
        };
    }

    // Add Volume settings support to existing openIndicatorSettings function
    if (typeof window.openIndicatorSettings === 'function') {
        const originalOpenIndicatorSettings = window.openIndicatorSettings;
        window.openIndicatorSettings = function(indicator) {
            if (indicator === 'volume') {
                // Populate Volume settings
                if (typeof indicatorSettings !== 'undefined' && indicatorSettings.volume) {
                    document.getElementById('volume-ma-period').value = indicatorSettings.volume.maPeriod;
                    document.getElementById('volume-up-color').value = indicatorSettings.volume.upColor;
                    document.getElementById('volume-down-color').value = indicatorSettings.volume.downColor;
                    document.getElementById('volume-ma-color').value = indicatorSettings.volume.maColor;
                    document.getElementById('volume-scale').value = indicatorSettings.volume.scaleFactor;
                    document.getElementById('volume-show-ma').checked = indicatorSettings.volume.showMA;
                }
                
                const modal = new bootstrap.Modal(document.getElementById('volumeSettingsModal'));
                modal.show();
            } else {
                // Call original function for other indicators
                originalOpenIndicatorSettings.call(this, indicator);
            }
        };
    }
});

// Shape Drawing Functions
function addShapeToChart(x, y) {
    if (!stockChart || !stockChart.options.plugins.annotation) return;
    
    const id = 'shape_' + Date.now();
    const annotations = stockChart.options.plugins.annotation.annotations;
    
    const shapeColor = shapeSettings.color;
    const shapeSize = shapeSettings.size;
    const shapeOpacity = shapeSettings.opacity;
    const shapeType = shapeSettings.type;
    const shapeLabel = shapeSettings.label;
    
    let annotation = {};
    
    switch (shapeType) {
        case 'rectangle':
            annotation = {
                type: 'box',
                xMin: new Date(x - 86400000), // 1 day width
                xMax: new Date(x + 86400000),
                yMin: y - (y * 0.02), // 2% height
                yMax: y + (y * 0.02),
                backgroundColor: shapeColor + Math.floor(shapeOpacity * 255).toString(16).padStart(2, '0'),
                borderColor: shapeColor,
                borderWidth: 2,
                draggable: true
            };
            break;
            
        case 'circle':
            annotation = {
                type: 'point',
                xValue: x,
                yValue: y,
                backgroundColor: shapeColor + Math.floor(shapeOpacity * 255).toString(16).padStart(2, '0'),
                borderColor: shapeColor,
                borderWidth: 3,
                radius: shapeSize,
                draggable: true
            };
            break;
            
        case 'arrow':
            // Create arrow using line with arrow-like appearance
            annotation = {
                type: 'line',
                xMin: x,
                xMax: new Date(x + 86400000 * 2),
                yMin: y,
                yMax: y,
                borderColor: shapeColor,
                borderWidth: 4,
                label: {
                    enabled: true,
                    content: '→',
                    position: 'end',
                    backgroundColor: shapeColor,
                    color: '#ffffff',
                    font: { size: 16, weight: 'bold' },
                    padding: 4
                },
                draggable: true
            };
            break;
            
        case 'triangle':
            // Create triangle using point with triangle symbol
            annotation = {
                type: 'point',
                xValue: x,
                yValue: y,
                backgroundColor: shapeColor + Math.floor(shapeOpacity * 255).toString(16).padStart(2, '0'),
                borderColor: shapeColor,
                borderWidth: 3,
                radius: shapeSize,
                pointStyle: 'triangle',
                draggable: true
            };
            break;
            
        case 'diamond':
            annotation = {
                type: 'point',
                xValue: x,
                yValue: y,
                backgroundColor: shapeColor + Math.floor(shapeOpacity * 255).toString(16).padStart(2, '0'),
                borderColor: shapeColor,
                borderWidth: 3,
                radius: shapeSize,
                pointStyle: 'rectRot',
                draggable: true
            };
            break;
            
        case 'star':
            annotation = {
                type: 'point',
                xValue: x,
                yValue: y,
                backgroundColor: shapeColor + Math.floor(shapeOpacity * 255).toString(16).padStart(2, '0'),
                borderColor: shapeColor,
                borderWidth: 3,
                radius: shapeSize,
                pointStyle: 'star',
                draggable: true
            };
            break;
    }
    
    // Add label if provided
    if (shapeLabel) {
        annotation.label = {
            enabled: true,
            content: shapeLabel,
            position: 'top',
            backgroundColor: shapeColor,
            color: '#ffffff',
            font: { size: 11, weight: 'bold' },
            padding: 6,
            cornerRadius: 4,
            yAdjust: -10
        };
    }
    
    annotations[id] = annotation;
    stockChart.update('none');
    
    // Store in annotations
    if (typeof chartAnnotations !== 'undefined') {
        chartAnnotations.shapes.push({
            id: id,
            type: shapeType,
            x: x,
            y: y,
            color: shapeColor,
            size: shapeSize,
            opacity: shapeOpacity,
            label: shapeLabel,
            timestamp: new Date().toISOString()
        });
        
        // Auto-save annotations
        if (window.currentSymbol) {
            saveAnnotationsToStorage(window.currentSymbol);
        }
    }
    
    showInfo(`${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)} shape added at $${y.toFixed(2)}`);
}

function clearAllShapes() {
    if (stockChart && stockChart.options.plugins.annotation) {
        const annotations = stockChart.options.plugins.annotation.annotations;
        Object.keys(annotations).forEach(key => {
            if (key.startsWith('shape_')) {
                delete annotations[key];
            }
        });
        stockChart.update('none');
        
        if (typeof chartAnnotations !== 'undefined') {
            chartAnnotations.shapes = [];
            
            // Auto-save annotations after clearing
            if (window.currentSymbol) {
                saveAnnotationsToStorage(window.currentSymbol);
            }
        }
        
        showInfo('All shapes cleared.');
    }
}

// Enhance the existing chart click handler to support shape mode
if (typeof window.handleChartClick === 'function') {
    const originalHandleChartClick = window.handleChartClick;
    window.handleChartClick = function(event, elements, ctx) {
        if (!stockChart) return;
        
        const canvasPosition = Chart.helpers.getRelativePosition(event, stockChart);
        const dataX = stockChart.scales.x.getValueForPixel(canvasPosition.x);
        const dataY = stockChart.scales.y.getValueForPixel(canvasPosition.y);
        
        // Handle shape mode
        if (typeof shapeMode !== 'undefined' && shapeMode) {
            addShapeToChart(dataX, dataY);
            shapeMode = false;
            return;
        }
        
        // Call original function for other modes
        originalHandleChartClick.call(this, event, elements, ctx);
    };
}

// Enhance annotation loading to include shapes
if (typeof window.loadAnnotationsFromStorage === 'function') {
    const originalLoadAnnotations = window.loadAnnotationsFromStorage;
    window.loadAnnotationsFromStorage = function(symbol) {
        const result = originalLoadAnnotations.call(this, symbol);
        
        // Initialize shapes array if not present
        if (typeof chartAnnotations !== 'undefined' && !chartAnnotations.shapes) {
            chartAnnotations.shapes = [];
        }
        
        return result;
    };
}

// Enhance annotation application to include shapes
if (typeof window.applyChartAnnotations === 'function') {
    const originalApplyAnnotations = window.applyChartAnnotations;
    window.applyChartAnnotations = function() {
        // Call original function first
        originalApplyAnnotations.call(this);
        
        // Apply shapes
        if (typeof chartAnnotations !== 'undefined' && chartAnnotations.shapes && stockChart) {
            chartAnnotations.shapes.forEach(shape => {
                const annotations = stockChart.options.plugins.annotation.annotations;
                
                let annotation = {};
                
                switch (shape.type) {
                    case 'rectangle':
                        annotation = {
                            type: 'box',
                            xMin: new Date(shape.x - 86400000),
                            xMax: new Date(shape.x + 86400000),
                            yMin: shape.y - (shape.y * 0.02),
                            yMax: shape.y + (shape.y * 0.02),
                            backgroundColor: shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'),
                            borderColor: shape.color,
                            borderWidth: 2,
                            draggable: true
                        };
                        break;
                        
                    case 'circle':
                        annotation = {
                            type: 'point',
                            xValue: shape.x,
                            yValue: shape.y,
                            backgroundColor: shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'),
                            borderColor: shape.color,
                            borderWidth: 3,
                            radius: shape.size,
                            draggable: true
                        };
                        break;
                        
                    case 'arrow':
                        annotation = {
                            type: 'line',
                            xMin: shape.x,
                            xMax: new Date(shape.x + 86400000 * 2),
                            yMin: shape.y,
                            yMax: shape.y,
                            borderColor: shape.color,
                            borderWidth: 4,
                            label: {
                                enabled: true,
                                content: '→',
                                position: 'end',
                                backgroundColor: shape.color,
                                color: '#ffffff',
                                font: { size: 16, weight: 'bold' },
                                padding: 4
                            },
                            draggable: true
                        };
                        break;
                        
                    case 'triangle':
                        annotation = {
                            type: 'point',
                            xValue: shape.x,
                            yValue: shape.y,
                            backgroundColor: shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'),
                            borderColor: shape.color,
                            borderWidth: 3,
                            radius: shape.size,
                            pointStyle: 'triangle',
                            draggable: true
                        };
                        break;
                        
                    case 'diamond':
                        annotation = {
                            type: 'point',
                            xValue: shape.x,
                            yValue: shape.y,
                            backgroundColor: shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'),
                            borderColor: shape.color,
                            borderWidth: 3,
                            radius: shape.size,
                            pointStyle: 'rectRot',
                            draggable: true
                        };
                        break;
                        
                    case 'star':
                        annotation = {
                            type: 'point',
                            xValue: shape.x,
                            yValue: shape.y,
                            backgroundColor: shape.color + Math.floor(shape.opacity * 255).toString(16).padStart(2, '0'),
                            borderColor: shape.color,
                            borderWidth: 3,
                            radius: shape.size,
                            pointStyle: 'star',
                            draggable: true
                        };
                        break;
                }
                
                // Add label if provided
                if (shape.label) {
                    annotation.label = {
                        enabled: true,
                        content: shape.label,
                        position: 'top',
                        backgroundColor: shape.color,
                        color: '#ffffff',
                        font: { size: 11, weight: 'bold' },
                        padding: 6,
                        cornerRadius: 4,
                        yAdjust: -10
                    };
                }
                
                annotations[shape.id] = annotation;
            });
            
            stockChart.update('none');
        }
    };
}

console.log('Volume Indicator and Shape Drawing functionality loaded successfully!'); 
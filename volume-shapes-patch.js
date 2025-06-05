// Volume Indicator and Shape Drawing Functionality Patch
// This file contains enhancements for the stock analysis application

// Ensure this runs after the main script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Loading Volume and Shape patch...');
    
    // Wait for main script to initialize
    setTimeout(function() {
        initializeVolumeAndShapeFeatures();
    }, 1000);
});

function initializeVolumeAndShapeFeatures() {
    console.log('Initializing Volume and Shape features...');
    
    // Volume Settings Event Handler
    const saveVolumeBtn = document.getElementById('save-volume-settings');
    if (saveVolumeBtn) {
        // Remove any existing listeners
        saveVolumeBtn.replaceWith(saveVolumeBtn.cloneNode(true));
        const newSaveVolumeBtn = document.getElementById('save-volume-settings');
        
        newSaveVolumeBtn.addEventListener('click', () => {
            console.log('Saving volume settings...');
            if (typeof window.indicatorSettings !== 'undefined') {
                window.indicatorSettings.volume.maPeriod = parseInt(document.getElementById('volume-ma-period').value);
                window.indicatorSettings.volume.upColor = document.getElementById('volume-up-color').value;
                window.indicatorSettings.volume.downColor = document.getElementById('volume-down-color').value;
                window.indicatorSettings.volume.maColor = document.getElementById('volume-ma-color').value;
                window.indicatorSettings.volume.scaleFactor = parseFloat(document.getElementById('volume-scale').value);
                window.indicatorSettings.volume.showMA = document.getElementById('volume-show-ma').checked;
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('volumeSettingsModal'));
                if (modal) modal.hide();
                
                // Update chart if Volume is active
                if (document.getElementById('volume-checkbox').checked && typeof window.updateChart === 'function') {
                    window.updateChart();
                }
                
                if (typeof window.showInfo === 'function') {
                    window.showInfo('Volume settings updated successfully!');
                }
            }
        });
        console.log('Volume settings handler attached');
    }

    // Shape Drawing Event Handlers
    const addShapeBtn = document.getElementById('add-shape-btn');
    const clearShapesBtn = document.getElementById('clear-shapes-btn');
    
    if (addShapeBtn) {
        // Remove any existing listeners
        addShapeBtn.replaceWith(addShapeBtn.cloneNode(true));
        const newAddShapeBtn = document.getElementById('add-shape-btn');
        
        newAddShapeBtn.addEventListener('click', () => {
            console.log('Add shape button clicked');
            if (typeof window.stockChart === 'undefined' || !window.stockChart) {
                if (typeof window.showError === 'function') {
                    window.showError('Chart not available. Please load stock data first.');
                }
                return;
            }
            
            // Update shape settings from form
            if (typeof window.shapeSettings !== 'undefined') {
                window.shapeSettings.type = document.getElementById('shape-type').value;
                window.shapeSettings.color = document.getElementById('shape-color').value;
                window.shapeSettings.size = parseInt(document.getElementById('shape-size').value);
                window.shapeSettings.opacity = parseFloat(document.getElementById('shape-opacity').value);
                window.shapeSettings.label = document.getElementById('shape-label').value;
            }
            
            if (typeof window.shapeMode !== 'undefined') {
                window.shapeMode = true;
                if (typeof window.showInfo === 'function') {
                    window.showInfo('Click on the chart to add a shape.');
                }
                
                // Close dropdown
                const shapeDropdown = document.getElementById('shape-options');
                const dropdownInstance = bootstrap.Dropdown.getInstance(shapeDropdown);
                if (dropdownInstance) {
                    dropdownInstance.hide();
                }
            }
        });
        console.log('Add shape handler attached');
    }

    if (clearShapesBtn) {
        // Remove any existing listeners
        clearShapesBtn.replaceWith(clearShapesBtn.cloneNode(true));
        const newClearShapesBtn = document.getElementById('clear-shapes-btn');
        
        newClearShapesBtn.addEventListener('click', () => {
            console.log('Clear shapes button clicked');
            if (typeof clearAllShapes === 'function') {
                clearAllShapes();
            }
        });
        console.log('Clear shapes handler attached');
    }

    // Shape settings change handlers
    const shapeInputs = ['shape-type', 'shape-color', 'shape-size', 'shape-opacity', 'shape-label'];
    shapeInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && typeof window.shapeSettings !== 'undefined') {
            input.addEventListener('change', function() {
                switch(inputId) {
                    case 'shape-type':
                        window.shapeSettings.type = this.value;
                        break;
                    case 'shape-color':
                        window.shapeSettings.color = this.value;
                        break;
                    case 'shape-size':
                        window.shapeSettings.size = parseInt(this.value);
                        break;
                    case 'shape-opacity':
                        window.shapeSettings.opacity = parseFloat(this.value);
                        break;
                    case 'shape-label':
                        window.shapeSettings.label = this.value;
                        break;
                }
            });
        }
    });

    // Override the addSelectedIndicator function to support Volume
    if (typeof window.addSelectedIndicator === 'function') {
        const originalAddSelectedIndicator = window.addSelectedIndicator;
        window.addSelectedIndicator = function() {
            const select = document.getElementById('indicator-select');
            const selectedValue = select.value;
            console.log('Adding indicator:', selectedValue);
            
            if (selectedValue === 'volume') {
                // Update the corresponding checkbox
                const checkbox = document.getElementById('volume-checkbox');
                if (checkbox) {
                    checkbox.checked = true;
                    
                    // Show the indicator badge
                    const badge = document.getElementById('volume-indicator');
                    if (badge) {
                        badge.style.display = 'flex';
                    }
                    
                    // Reset the dropdown
                    select.value = '';
                    
                    if (typeof window.showInfo === 'function') {
                        window.showInfo('Volume indicator added. Use settings to customize.');
                    }
                    
                    // Update the chart
                    if (typeof window.updateChart === 'function') {
                        window.updateChart();
                    }
                }
            } else {
                // Call original function for other indicators
                originalAddSelectedIndicator.call(this);
            }
        };
        console.log('addSelectedIndicator function overridden for Volume support');
    }

    // Override the removeIndicator function to support Volume
    if (typeof window.removeIndicator === 'function') {
        const originalRemoveIndicator = window.removeIndicator;
        window.removeIndicator = function(indicator) {
            console.log('Removing indicator:', indicator);
            if (indicator === 'volume') {
                // Update the corresponding checkbox
                const checkbox = document.getElementById('volume-checkbox');
                if (checkbox) {
                    checkbox.checked = false;
                    
                    // Hide the indicator badge
                    const badge = document.getElementById('volume-indicator');
                    if (badge) {
                        badge.style.display = 'none';
                    }
                    
                    // Update the chart
                    if (typeof window.updateChart === 'function') {
                        window.updateChart();
                    }
                }
            } else {
                // Call original function for other indicators
                originalRemoveIndicator.call(this, indicator);
            }
        };
        console.log('removeIndicator function overridden for Volume support');
    }

    // Override the openIndicatorSettings function to support Volume
    if (typeof window.openIndicatorSettings === 'function') {
        const originalOpenIndicatorSettings = window.openIndicatorSettings;
        window.openIndicatorSettings = function(indicator) {
            console.log('Opening settings for:', indicator);
            if (indicator === 'volume') {
                // Populate Volume settings
                if (typeof window.indicatorSettings !== 'undefined' && window.indicatorSettings.volume) {
                    const volumeSettings = window.indicatorSettings.volume;
                    document.getElementById('volume-ma-period').value = volumeSettings.maPeriod;
                    document.getElementById('volume-up-color').value = volumeSettings.upColor;
                    document.getElementById('volume-down-color').value = volumeSettings.downColor;
                    document.getElementById('volume-ma-color').value = volumeSettings.maColor;
                    document.getElementById('volume-scale').value = volumeSettings.scaleFactor;
                    document.getElementById('volume-show-ma').checked = volumeSettings.showMA;
                }
                
                const modal = new bootstrap.Modal(document.getElementById('volumeSettingsModal'));
                modal.show();
            } else {
                // Call original function for other indicators
                originalOpenIndicatorSettings.call(this, indicator);
            }
        };
        console.log('openIndicatorSettings function overridden for Volume support');
    }

    console.log('Volume and Shape features initialized successfully!');
}

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
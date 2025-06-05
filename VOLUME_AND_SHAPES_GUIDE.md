# Volume Indicator and Shape Drawing Tools Guide

This guide explains how to use the newly added Volume indicator and Shape drawing tools in the Stock Analysis Web Application.

## Volume Indicator

### Adding Volume Indicator
1. In the **Indicators** section, select "Volume" from the dropdown menu
2. Click the **+** button to add the indicator
3. The Volume indicator badge will appear in the active indicators section

### Volume Features
- **Volume Bars**: Colored bars representing trading volume
  - Green bars: Price increased from previous period
  - Red bars: Price decreased from previous period
- **Volume Moving Average**: Optional overlay showing average volume trend
- **Smart Scaling**: Volume chart automatically scales to fit data

### Volume Settings
Click the ⚙️ settings button on the Volume indicator badge to customize:

#### Settings Options
- **Volume MA Period**: Period for moving average calculation (5-50)
- **Up Volume Color**: Color for positive price movement bars
- **Down Volume Color**: Color for negative price movement bars
- **Volume MA Line Color**: Color for the moving average line
- **Volume Chart Scale**: Height of volume chart relative to price chart (20%-50%)
- **Show Volume Moving Average**: Toggle to display/hide the MA line

#### Default Values
- MA Period: 20
- Up Color: Green (#22c55e)
- Down Color: Red (#ef4444)
- MA Color: Blue (#3b82f6)
- Scale: 30%
- Show MA: Enabled

## Shape Drawing Tools

### Available Shapes
The application supports 6 different shape types:

1. **Rectangle**: Box-shaped annotations
2. **Circle**: Circular point markers
3. **Arrow**: Directional indicators
4. **Triangle**: Triangular point markers
5. **Diamond**: Diamond-shaped point markers
6. **Star**: Star-shaped point markers

### Adding Shapes
1. In the **Tools** section, click the **Shape** dropdown
2. Configure your shape settings:
   - **Shape**: Select the desired shape type
   - **Color**: Choose the shape color
   - **Size**: Set the shape size (Small/Medium/Large/X-Large)
   - **Opacity**: Control transparency (30%-100%)
   - **Label**: Optional text label for the shape

3. Click **Add Shape** button
4. Click anywhere on the chart to place the shape

### Shape Customization Options

#### Size Options
- **Small**: 20px radius
- **Medium**: 30px radius (default)
- **Large**: 40px radius
- **X-Large**: 50px radius

#### Opacity Levels
- **30%**: Very transparent
- **50%**: Semi-transparent
- **70%**: Mostly opaque (default)
- **100%**: Fully opaque

### Shape Management

#### Moving Shapes
- All shapes are **draggable** after creation
- Click and drag any shape to reposition it
- Position changes are automatically saved

#### Clearing Shapes
- Click **Clear Shapes** button to remove all shapes
- Individual shapes can be deleted using the annotation system

### Shape Labels
- Add optional text labels to any shape
- Labels appear above the shape with contrasting colors
- Useful for marking support/resistance levels, targets, etc.

## Integration with Chart Features

### Chart Type Compatibility
- Volume indicator works with both **Line** and **Candlestick** charts
- Shapes are compatible with all chart types
- All annotations persist when switching chart types

### Zoom and Pan Support
- Volume bars scale correctly with chart zoom
- Shapes maintain position during pan/zoom operations
- All elements remain interactive at any zoom level

### Data Persistence
- Volume settings are saved per session
- Shape positions and properties are saved to local storage
- Annotations restore automatically when reloading charts

### Annotation System Integration
- Shapes integrate with the existing annotation system
- Support for dragging and repositioning like other annotations
- Collision detection with 20-pixel tolerance for easy selection

## Technical Details

### Volume Data Sources
- Volume data comes from the same API as price data
- Automatically formatted (K, M, B notation)
- Handles missing volume data gracefully

### Volume Calculations
- **Volume MA**: Simple moving average of volume over specified period
- **Volume Rate of Change**: Percentage change in volume over time
- **On Balance Volume**: Cumulative volume based on price direction

### Shape Rendering
- Shapes use Chart.js annotation plugin
- Hardware-accelerated rendering for smooth performance
- Responsive design adapts to different screen sizes

## Tips and Best Practices

### Volume Analysis
1. **High Volume Breakouts**: Look for price movements with above-average volume
2. **Volume Confirmation**: Use volume to confirm price trends
3. **Divergence Signals**: Watch for price/volume divergences

### Shape Usage
1. **Support/Resistance**: Use rectangles to mark key levels
2. **Entry Points**: Use arrows to mark trade entries
3. **Targets**: Use stars or diamonds for price targets
4. **Pattern Recognition**: Use shapes to outline chart patterns

### Performance Tips
1. Limit the number of shapes on chart for optimal performance
2. Use appropriate opacity to avoid cluttering the chart
3. Regular cleanup of old annotations keeps charts clean

## Troubleshooting

### Common Issues
1. **Shapes not appearing**: Ensure chart data is loaded first
2. **Volume not showing**: Check if volume data is available for the symbol
3. **Settings not saving**: Verify local storage is enabled in browser

### Browser Compatibility
- Modern browsers with ES6+ support required
- Local storage must be enabled for persistence
- Hardware acceleration recommended for smooth rendering

## Keyboard Shortcuts

- **Escape**: Exit shape drawing mode
- **Delete**: Remove selected annotation/shape
- **Ctrl+Z**: Undo last annotation (if implemented)

This completes the Volume Indicator and Shape Drawing Tools functionality, providing professional-grade charting capabilities for technical analysis. 
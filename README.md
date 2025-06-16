# Stock Analysis Web Application

A comprehensive web-based stock analysis tool with advanced charting, technical indicators, price prediction, and interactive drawing tools.

## 🚀 Features

### ✅ Core Features
- **Real-time Stock Data**: Live stock price data with historical charts
- **Interactive Charts**: Line and Candlestick chart types with zoom/pan functionality
- **Technical Indicators**: SMA, RSI, MACD, and Volume indicators with customizable settings
- **Price Prediction**: Advanced multi-model prediction system with confidence intervals
- **Responsive Design**: Modern UI with light/dark theme support

### ✅ Advanced Features
- **Chart Drawing Tools**: 
  - Trend lines with customizable colors, widths, and styles
  - Support and resistance line types
  - Interactive drawing with click-to-draw interface
- **Signal Markers**: Buy/sell signal annotations with custom labels
- **Personal Notes**: Add and manage notes on chart data points with categories
- **TP/SL Tools**: Take Profit and Stop Loss level markers for risk management
- **Multiple Timeframes**: 1 week and 1 month data views
- **Company Information**: Comprehensive fundamental data display
- **Financial Statements**: Income statement, balance sheet, and cash flow data

### ✅ Technical Implementation
- **Enhanced Prediction Models**:
  - Linear Regression with R-squared accuracy
  - Moving Average with trend analysis
  - Exponential Smoothing with level and trend
  - Autoregressive prediction (ARIMA-like)
  - Combined model ensemble with weighted predictions
  - Multi-step forecasting (1-30 days)
  - Confidence intervals and accuracy metrics (MAE, MSE, RMSE, MAPE)

- **Complete Charting System**:
  - Chart.js with Financial plugin for candlestick charts
  - Interactive annotations with Chart.js Annotation plugin
  - Zoom and pan controls with reset functionality
  - Chart type toggle (Line/Candlestick)
  - Technical indicator overlays

- **Drawing Tools**:
  - Trend line drawing with draggable endpoints
  - Customizable line colors, widths, and styles (solid, dashed, dotted)
  - Support and resistance line types with labels
  - Clear individual or all lines functionality

- **Signal System**:
  - Buy/sell signal markers with custom labels
  - TP/SL (Take Profit/Stop Loss) tools for risk management
  - Click-to-place signal functionality
  - Signal management and clearing

- **Notes System**:
  - Rich note creation with title, content, color, and type
  - Note categories (General, Technical Analysis, News/Event, Reminder)
  - Persistent note storage and hover tooltips

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ modules)
- **Charting**: Chart.js, Chart.js Financial, Chart.js Annotation Plugin
- **UI Framework**: Bootstrap 5, Font Awesome icons
- **Backend**: Node.js, Express.js
- **APIs**: Yahoo Finance API integration
- **Styling**: Custom CSS with CSS Grid and Flexbox

## 📋 Prerequisites

- **Node.js v18.0.0 or higher** 
- npm package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/031105/twt_individual.git
   cd stock-analysis-web-application
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:

   **Option 1: Using the safe start script (Recommended)**
   ```bash
   ./start.sh
   ```

   **Option 2: Using npm scripts**
   ```bash
   npm run start-safe
   ```

   **Option 3: Standard method**
   ```bash
   npm start
   ```

4. **Open your browser and navigate to**:
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Getting Started
1. **Search for a Stock**: Enter a stock symbol (e.g., AAPL, MSFT, GOOGL) in the search box
2. **Select Timeframe**: Choose between 1 week or 1 month data views
3. **View Chart**: The application will display an interactive chart with current price data

### Technical Indicators
1. **Add Indicators**: Click the "+" button next to the indicator dropdown
2. **Select from Dropdown**: Choose SMA, RSI, MACD, or Volume
3. **Customize Settings**: Click the gear icon to adjust indicator parameters
4. **Remove Indicators**: Click the "×" button on indicator badges

### Chart Drawing Tools
1. **Draw Trend Lines**:
   - Click "Start Drawing" in the Line dropdown
   - Customize color, width, style, and line type
   - Click two points on the chart to create a line
   - Drag endpoints to adjust after creation
   
2. **Add Trading Signals**:
   - Click "Add" in the Signals dropdown
   - Choose "Buy Signal" or "Sell Signal"
   - Add custom labels for context
   - Click on the chart where you want to place the signal

3. **Add Notes**:
   - Click "Note" button in the Tools section
   - Fill in title, content, select color and category
   - Click "Add Note" to save
   - Hover over note markers to view content

4. **TP/SL Tools**:
   - Click "Bullish TP/SL" or "Bearish TP/SL"
   - Click three points: Entry, Stop Loss, Take Profit
   - View risk/reward ratio calculation

### Price Prediction
- View automatic predictions in the "Price Prediction" section
- See multiple model predictions with confidence levels
- Predictions include Moving Average, Exponential Smoothing, Linear Regression, and Combined models
- Adjust prediction timeframe (1-30 days)

### Chart Controls
- **Zoom**: Use mouse wheel or zoom buttons
- **Pan**: Drag to pan around the chart
- **Reset**: Click "Reset" to return to original view
- **Chart Type**: Toggle between Line and Candlestick charts

## 🎨 UI Features

### Modern Design Elements
- **Compact Layout**: Horizontal control sections for efficient space usage
- **Gradient Buttons**: Professional gradient styling for all controls
- **Consistent Heights**: Unified button heights for visual harmony
- **Responsive Layout**: Adapts to different screen sizes
- **Dark/Light Themes**: Toggle between themes with the theme button
- **Animated Transitions**: Smooth hover effects and state changes

### Control Sections
- **Indicators**: Add and manage technical indicators
- **Chart**: Chart type and timeframe controls
- **Tools**: Drawing tools for lines and notes
- **Signals**: Trading signal placement and TP/SL tools
- **View**: Zoom and reset controls

## 🔧 Configuration

### Indicator Settings
- **SMA**: Period (5-200), color, line width and style
- **RSI**: Period (2-50), overbought/oversold levels, colors
- **MACD**: Fast/slow/signal periods, colors for each line
- **Volume**: Moving average period, up/down colors, chart scale

### Drawing Tool Settings
- **Lines**: Color, width (1-4px), style (solid/dashed/dotted)
- **Signals**: Custom labels, buy/sell types
- **Notes**: Title, content, color, category type

## 📊 Prediction Models

### 1. Linear Regression
- Uses least squares regression on recent price data
- Calculates R-squared for accuracy measurement
- Configurable lookback period

### 2. Moving Average
- Simple moving average with trend calculation
- Adaptive to recent price movements
- Configurable period

### 3. Exponential Smoothing
- Double exponential smoothing with level and trend
- Alpha and beta parameters for smoothing
- Responsive to recent price changes

### 4. Combined Model
- Ensemble of all prediction models
- Weighted average with confidence calculation
- Multi-step forecasting capability

## 🎯 Accuracy Metrics

- **MAE** (Mean Absolute Error): Average prediction error
- **MSE** (Mean Squared Error): Squared prediction errors
- **RMSE** (Root Mean Squared Error): Standard deviation of errors
- **MAPE** (Mean Absolute Percentage Error): Percentage accuracy
- **Confidence Intervals**: Statistical confidence bounds

## 🔄 Data Persistence

- **Annotations**: All drawings, signals, and notes are automatically saved
- **Indicator Settings**: User preferences for indicator parameters
- **Theme Settings**: Light/dark mode preference
- **Chart State**: Timeframe and chart type selections

## 🛡️ Error Handling

- Comprehensive error messages for user guidance
- Graceful fallbacks for missing data
- Network error recovery with retry mechanisms
- Input validation and sanitization
- Loading states and progress indicators

## 🚧 Browser Compatibility

### Supported Browsers
- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

### Requirements
- ES6+ module support
- Canvas API support
- Fetch API support
- LocalStorage support

## 📁 Project Structure

```
stock-analysis-web-application/
├── index.html              # Main HTML file
├── script.js               # Main JavaScript application
├── style.css               # Custom CSS styles
├── config.js               # Configuration and constants
├── server.js               # Node.js Express server
├── package.json            # NPM dependencies
├── start.sh                # Safe startup script
├── utils/
│   ├── indicators.js       # Technical indicators
│   └── prediction.js       # Prediction models
└── mockData/
    └── sample-data.json     # Sample data for testing
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Assignment Information

**Course**: TWT6223 Web Development  
**Student**: Goh Shun Da  
**Student ID**: 1231303151  
**Assignment**: Individual Project - Stock Analysis Web Application  

## 🏆 Key Achievements

- ✅ **Complete Technical Implementation**: Full-featured stock analysis application
- ✅ **Advanced Charting**: Interactive charts with multiple visualization types
- ✅ **Prediction System**: Multi-model forecasting with statistical metrics
- ✅ **Drawing Tools**: Professional-grade annotation and drawing capabilities
- ✅ **Responsive Design**: Modern UI that works across all device sizes
- ✅ **Data Persistence**: Automatic saving of user annotations and preferences
- ✅ **Error Handling**: Robust error handling and user feedback systems

## 📞 Support

For questions or support:
- Create an issue in the repository
- Check the code documentation
- Review the usage guide above

---

**Version**: 3.0.0  
**Last Updated**: June 2025
**Status**: Production Ready ✅  
**Assignment**: TWT6223 Individual Project 🎓 
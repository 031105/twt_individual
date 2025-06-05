# Stock Analysis Web Application

A comprehensive web-based stock analysis tool with advanced charting, technical indicators, price prediction, and interactive drawing tools.

## 🚀 Features Implemented

### ✅ Core Features
- **Real-time Stock Data**: Live stock price data with historical charts
- **Interactive Charts**: Line and Candlestick chart types with zoom/pan functionality
- **Technical Indicators**: SMA, RSI, MACD with customizable settings
- **Price Prediction**: Advanced multi-model prediction system with confidence intervals
- **Responsive Design**: Modern UI with light/dark theme support

### ✅ Advanced Features
- **Chart Drawing Tools**: Trend lines, support/resistance lines with customizable styles
- **Signal Markers**: Buy/sell signal annotations on charts
- **Personal Notes**: Add and manage notes on chart data points
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
  - Zoom and pan controls
  - Chart type toggle (Line/Candlestick)
  - Technical indicator overlays

- **Drawing Tools**:
  - Trend line drawing with click-to-draw interface
  - Customizable line colors, widths, and styles
  - Support and resistance line types
  - Clear individual or all lines functionality

- **Signal System**:
  - Buy/sell signal markers
  - Click-to-place signal functionality
  - Signal management and clearing

- **Notes System**:
  - Rich note creation with title, content, color, and type
  - Note categories (General, Technical Analysis, News/Event, Reminder)
  - Persistent note storage

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+ modules)
- **Charting**: Chart.js, Chart.js Financial, ECharts, TradingView Lightweight Charts
- **UI Framework**: Bootstrap 5, Font Awesome icons
- **Backend**: Node.js, Express.js
- **APIs**: Yahoo Finance API integration
- **Styling**: Custom CSS with CSS Grid and Flexbox

## 📋 Prerequisites

- **Node.js v24.1.0 or higher** ⚠️ **重要：必须使用v24+版本**
- npm package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation & Setup

1. **Clone or download the project**:
   ```bash
   git clone <repository-url>
   cd stock-analysis-web-application
   ```

2. **确保Node.js版本正确** ⚠️ **关键步骤**:
   ```bash
   node --version  # 应该显示 v24.x.x
   ```
   
   如果显示的是v18.x.x或其他旧版本，请查看 [故障排除指南](TROUBLESHOOTING.md)

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the application** (推荐方式):

   **方法 1: 使用安全启动脚本 (推荐)**
   ```bash
   ./start.sh
   ```

   **方法 2: 使用npm脚本**
   ```bash
   npm run start-safe
   ```

   **方法 3: 标准方式**
   ```bash
   npm start
   ```

5. **Open your browser and navigate to**:
   ```
   http://localhost:3000
   ```

## ⚠️ 重要提醒

### Node.js 版本兼容性
此应用需要 **Node.js v24.0.0 或更高版本** 才能正常运行。如果遇到以下错误：

```
SyntaxError: Unexpected token 'with'
```

这意味着您的Node.js版本过旧。请：

1. 首先尝试使用安全启动脚本：`./start.sh`
2. 如果仍有问题，请查看 [故障排除指南](TROUBLESHOOTING.md)
3. 或者升级您的Node.js版本

### 启动选项对比

| 启动方式 | 优点 | 使用场景 |
|---------|------|----------|
| `./start.sh` | 自动检查版本，最安全 | **推荐用于日常使用** |
| `npm run start-safe` | 使用npm管理，自动设置PATH | 偏好npm命令的用户 |
| `npm start` | 标准方式 | Node.js版本已确认正确时 |

## 📖 Usage Guide

### Getting Started
1. **Search for a Stock**: Enter a stock symbol (e.g., AAPL, MSFT, GOOGL) in the search box
2. **Select Timeframe**: Choose between 1 week or 1 month data views
3. **View Chart**: The application will display an interactive chart with current price data

### Technical Indicators
1. **Add Indicators**: Click the "+" button next to technical indicators
2. **Select from Dropdown**: Choose SMA, RSI, or MACD
3. **Customize Settings**: Click the gear icon to adjust indicator parameters
4. **Remove Indicators**: Click the "×" button on indicator badges

### Chart Drawing Tools
1. **Draw Trend Lines**:
   - Click "Draw Line" dropdown
   - Customize color, width, and style
   - Click "Start Drawing"
   - Click two points on the chart to create a line
   
2. **Add Signals**:
   - Click "Signals" dropdown
   - Choose "Buy Signal" or "Sell Signal"
   - Click on the chart where you want to place the signal

3. **Add Notes**:
   - Click "Add Note" button
   - Fill in title, content, select color and type
   - Click "Add Note" to save

### Price Prediction
- View automatic predictions in the "Price Prediction" section
- See multiple model predictions with confidence levels
- Predictions include Moving Average, Exponential Smoothing, Linear Regression, and Combined models

### Chart Controls
- **Zoom**: Use mouse wheel or zoom buttons
- **Pan**: Enable pan mode with the pan button
- **Reset**: Click "Reset Zoom" to return to original view
- **Chart Type**: Toggle between Line and Candlestick charts

## 🎨 UI Features

### Modern Design Elements
- **Gradient Buttons**: Professional gradient styling for all controls
- **Consistent Heights**: Unified 38px height for all buttons
- **Responsive Layout**: Adapts to different screen sizes
- **Dark/Light Themes**: Toggle between themes with the moon/sun icon
- **Animated Transitions**: Smooth hover effects and state changes

### Color Scheme
- **Primary**: Blue gradient (#007bff to #0056b3)
- **Success**: Green (#28a745)
- **Danger**: Red (#dc3545)
- **Warning**: Orange (#ffc107)
- **Info**: Cyan (#17a2b8)

## 🔧 Configuration

### Chart Settings
- Default theme: Light
- Zoom enabled on X-axis
- Technical indicator colors and periods configurable
- Prediction model parameters adjustable

### API Configuration
- Yahoo Finance integration for real-time data
- Caching for performance optimization
- Error handling and retry mechanisms

## 📊 Prediction Models

### 1. Linear Regression
- Uses least squares regression on recent price data
- Calculates R-squared for accuracy measurement
- Configurable lookback period (default: 30 days)

### 2. Moving Average
- Simple moving average with trend calculation
- Adaptive to recent price movements
- Configurable period (default: 20 days)

### 3. Exponential Smoothing
- Double exponential smoothing with level and trend
- Alpha and beta parameters for smoothing
- Responsive to recent price changes

### 4. Autoregressive Model
- ARIMA-like prediction using historical relationships
- Multiple regression on lagged values
- Configurable order (default: 3)

### 5. Combined Model
- Ensemble of all prediction models
- Weighted average with confidence calculation
- Multi-step forecasting capability

## 🎯 Accuracy Metrics

- **MAE** (Mean Absolute Error): Average prediction error
- **MSE** (Mean Squared Error): Squared prediction errors
- **RMSE** (Root Mean Squared Error): Standard deviation of errors
- **MAPE** (Mean Absolute Percentage Error): Percentage accuracy
- **R-squared**: Correlation coefficient for linear models
- **Confidence Intervals**: Statistical confidence bounds

## 🚧 Known Limitations

1. **Data Dependency**: Prediction accuracy depends on data quality and quantity
2. **Market Volatility**: Predictions may be less accurate during high volatility periods
3. **API Limits**: Subject to Yahoo Finance API rate limits
4. **Browser Compatibility**: Requires modern browsers with ES6+ support

## 🛡️ Error Handling

- Comprehensive error messages for user guidance
- Graceful fallbacks for missing data
- Network error recovery
- Input validation and sanitization

## 🔮 Future Enhancements

- Real-time data streaming
- Portfolio tracking
- Alert system
- Social features
- Export functionality
- Machine learning improvements
- Mobile app version

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- 查看 [故障排除指南](TROUBLESHOOTING.md) 解决常见问题
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🎉 Acknowledgments

- Yahoo Finance for stock data API
- Chart.js community for excellent charting library
- Bootstrap team for UI framework
- Font Awesome for icons
- Open source community for various utilities

---

**Version**: 2.0.0  
**Last Updated**: June 2024  
**Status**: Production Ready ✅
**Node.js**: v24.1.0+ Required ⚠️ 
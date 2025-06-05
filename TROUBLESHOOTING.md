# 故障排除指南 (Troubleshooting Guide)

## 🚨 常见问题及解决方案

### 1. Node.js 版本兼容性问题

**症状**: 
```
SyntaxError: Unexpected token 'with'
Node.js v18.17.0
```

**原因**: yahoo-finance2 包需要 Node.js v24+ 才能支持 `import ... with { type: "json" }` 语法

**解决方案**:

#### 方法 1: 使用安全启动脚本 (推荐)
```bash
./start.sh
```

#### 方法 2: 手动设置PATH
```bash
export PATH="/opt/homebrew/bin:$PATH"
npm start
```

#### 方法 3: 使用带PATH的npm脚本
```bash
npm run start-safe
```

### 2. 检查当前Node.js版本
```bash
node --version
```
应该显示 `v24.1.0` 或更高版本

### 3. 检查Node.js安装路径
```bash
which node
```
正确路径应该是: `/opt/homebrew/bin/node`

### 4. 如果仍然使用旧版本

#### 检查是否有NVM干扰:
```bash
nvm current  # 如果显示v18.17.0，说明NVM在使用旧版本
```

#### 临时禁用NVM:
```bash
unset NVM_DIR
export PATH="/opt/homebrew/bin:$PATH"
```

#### 永久解决方案 - 更新shell配置:
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 5. 完全重新安装Node.js (极端情况)

如果上述方法都不起作用:

```bash
# 卸载所有Node.js版本
brew uninstall node
nvm uninstall 18.17.0  # 如果使用NVM

# 重新安装
brew install node

# 验证安装
node --version  # 应该显示 v24.x.x
```

## 📋 启动检查清单

在启动应用前，请确认:

1. ✅ Node.js 版本 >= 24.0.0
2. ✅ npm 可用
3. ✅ 端口 3000 未被占用
4. ✅ 网络连接正常 (用于API调用)

## 🔧 快速诊断命令

运行以下命令进行快速诊断:

```bash
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"
echo "Node.js 路径: $(which node)"
echo "npm 路径: $(which npm)"
echo "当前目录: $(pwd)"
echo "package.json 存在: $(test -f package.json && echo '是' || echo '否')"
echo "node_modules 存在: $(test -d node_modules && echo '是' || echo '否')"
```

## 🌐 网络问题

如果遇到API调用失败:

1. 检查网络连接
2. 验证防火墙设置
3. 确认代理配置 (如果有)

测试API连接:
```bash
curl -s "https://query1.finance.yahoo.com/v8/finance/chart/AAPL" | head -5
```

## 📱 浏览器兼容性

支持的浏览器:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🆘 仍然有问题？

如果按照上述步骤仍然无法解决问题:

1. 确保您使用的是最新的应用代码
2. 删除 `node_modules` 文件夹并重新安装: `rm -rf node_modules && npm install`
3. 重启终端并重新尝试
4. 检查系统是否有其他Node.js版本管理工具干扰

## 🎯 成功启动的标志

当应用成功启动时，您应该看到:

```
🚀 Starting Stock Analysis Web Application...
📌 Using Node.js version: v24.1.0
✅ Node.js version is correct
🌟 Starting server on http://localhost:3000
```

然后在浏览器中访问 `http://localhost:3000` 应该能看到应用界面。 
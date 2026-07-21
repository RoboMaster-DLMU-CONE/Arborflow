# ArborFlow

ArborFlow 是一个面向 [BehaviorTree.CPP](https://github.com/BehaviorTree/BehaviorTree.CPP) 的跨平台行为树生成、编辑与运行状态可视化工具。

项目使用 Electron、React、TypeScript 和 React Flow 构建，可在 Windows、Linux 与 macOS 上运行。一个工程可以包含多棵行为树，并通过 `SubTree` 节点相互引用。

## 主要功能

- 拖拽创建节点并通过端口连接父子关系
- 支持控制、装饰、动作、条件和子树节点
- 自动阻止环路、重复父节点以及非法子节点数量
- 编辑节点注册名称、端口、黑板表达式、备注和断点标记
- 自动布局、画布缩放、小地图、撤销与重做
- 保存和打开 `.arborflow` 工程文件
- 导入、导出和预览 BehaviorTree.CPP v4 XML
- 导入多棵 `BehaviorTree` 并在顶部树选择器中切换
- 解析 `TreeNodesModel`，加载自定义节点及其端口默认值
- 通过 WebSocket 或 `rosbridge_server` 实时显示节点状态
- 实时事件流、消息计数、节点匹配统计、延迟检测和自动重连

支持的运行状态：

| 状态 | 数值 | 含义 |
| --- | ---: | --- |
| `IDLE` | `0` | 节点空闲 |
| `RUNNING` | `1` | 节点正在执行 |
| `SUCCESS` | `2` | 节点执行成功 |
| `FAILURE` | `3` | 节点执行失败 |
| `SKIPPED` | `4` | 节点被跳过 |

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本
- Windows 10/11、主流 Linux 发行版或 macOS

## 快速开始

进入项目目录并安装依赖：

```powershell
cd "D:\Elec Control\ArborFlow"
npm install
```

启动 Electron 开发模式：

```bash
npm run dev
```

执行类型检查并构建前端资源：

```bash
npm run build
```

构建完成后，可单独启动浏览器预览：

```bash
npm run preview
```

## 基本操作

1. 从左侧节点库单击节点，或将节点拖入画布。
2. 从父节点底部连接点拖到子节点顶部连接点。
3. 选中节点后，在右侧检查器修改名称、端口、黑板参数或断点。
4. 使用工具栏的自动布局按钮整理整棵树。
5. 多树工程可通过画布左上方的树选择器切换当前行为树。
6. 将工程保存为 `.arborflow`，或导出为 BehaviorTree.CPP XML。
7. 打开 Monitor，填写机器人地址后连接实时状态流。

工程文件保存全部行为树、编辑器坐标、节点 ID、节点模型、端口和备注等完整信息。XML 不包含编辑器坐标或实时运行状态。

## BehaviorTree.CPP XML

ArborFlow 导出 BehaviorTree.CPP v4 格式：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root BTCPP_format="4" main_tree_to_execute="MainTree">
    <BehaviorTree ID="MainTree">
        <Sequence name="Mission Sequence">
            <Condition ID="BatteryOK" min_level="{battery_threshold}"/>
            <Action ID="NavigateToPose" goal="{goal}"/>
        </Sequence>
    </BehaviorTree>
</root>
```

同一父节点下的执行顺序按照子节点在画布上的横向位置从左到右确定。导出前必须保证画布中只有一个根节点，并且所有节点组成一棵无环树。

XML 没有声明 `main_tree_to_execute` 时，ArborFlow 会分析所有 `SubTree` 引用，将没有被其他树引用的行为树推断为主树。存在多个候选时，优先使用 `MainTree`，否则使用 XML 中最后一棵树。

`TreeNodesModel` 中的自定义 Action、Condition、Decorator 和 Control 会进入左侧的“XML 自定义节点”分组。端口名称、方向、类型、默认值和描述会在工程及再次导出的 XML 中保留。

## Real-time Monitor

监视器支持两种接入方式：

- ROS 或其他程序直接提供 WebSocket JSON 服务
- 使用 `rosbridge_server` 订阅 ROS 2 topic

节点引用按以下顺序匹配：

1. 检查器中显示的 ArborFlow 节点 ID
2. 节点显示名称或 BehaviorTree.CPP 注册名称
3. 路径最后一段，例如 `/MainTree/NavigateToPose` 会匹配 `NavigateToPose`

名称重复时，同名节点会同时更新。需要精确定位时，应发送 ArborFlow 节点 ID。

### 直接 WebSocket 协议

每个 WebSocket 消息必须是一个 JSON 对象。单节点事件示例：

```json
{
  "type": "status",
  "nodeId": "navigate_action",
  "status": "RUNNING",
  "timestamp": 1784635200000
}
```

节点字段可以使用 `nodeId`、`uid`、`node`、`name` 或 `path`。`status` 可以是状态字符串，也可以是 BehaviorTree.CPP 对应的 `0` 至 `4` 数值。

一次更新多个节点：

```json
{
  "type": "snapshot",
  "timestamp": 1784635200000,
  "nodes": {
    "BatteryOK": "SUCCESS",
    "NavigateToPose": "RUNNING",
    "ReportResult": "IDLE"
  }
}
```

连接成功后，ArborFlow 会发送订阅消息：

```json
{"type":"subscribe","client":"ArborFlow","protocol":1}
```

客户端每五秒发送一次 ping。服务端原样返回时间戳即可显示往返延迟：

```json
{"type":"pong","timestamp":1784635200000}
```

### 使用 rosbridge_server

启动 ROS 2 rosbridge：

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

在 Monitor 中填写：

- WebSocket 地址：`ws://ROBOT_IP:9090`
- Topic：`/arborflow/status`

ArborFlow 会自动发送以下 rosbridge 订阅请求：

```json
{
  "op": "subscribe",
  "topic": "/arborflow/status",
  "type": "std_msgs/msg/String"
}
```

ROS topic 使用 `std_msgs/msg/String`，将直接 WebSocket 协议中的 JSON 放入 `data` 字段：

```bash
ros2 topic pub --once /arborflow/status std_msgs/msg/String \
  "{data: '{\"node\":\"NavigateToPose\",\"status\":\"RUNNING\"}'}"
```

### 本地模拟服务

项目包含一个用于联调的 WebSocket 状态模拟器：

```bash
npm run mock:monitor
```

随后在 Monitor 中连接：

```text
ws://127.0.0.1:1667
```

模拟器会让示例树中的 `BatteryOK`、`NavigateToPose` 和 `ReportResult` 循环切换状态。可通过环境变量修改端口：

```powershell
$env:ARBORFLOW_MOCK_PORT=1767
npm run mock:monitor
```

## 打包桌面应用

在当前操作系统上构建对应安装包：

```bash
npm run dist
```

也可以使用平台命令：

```bash
npm run dist:win
npm run dist:linux
npm run dist:mac
```

输出按平台分别保存到 `release/windows/`、`release/linux/` 和 `release/macos/`。建议在目标操作系统上执行对应打包命令，特别是 macOS 签名、公证以及不同 CPU 架构的构建。

仓库内的 `.github/workflows/build-release.yml` 会在 Windows、Ubuntu 和 macOS 原生运行器上并行打包。可在 GitHub Actions 中手动运行，也会在推送 `v*` 标签时自动执行并上传三个独立平台产物。

可用的默认目标：

| 平台 | 输出格式 |
| --- | --- |
| Windows | NSIS 安装包、Portable |
| Linux | AppImage、deb |
| macOS | dmg、zip |

重新生成应用图标：

```bash
npm run icon:render
```

## npm 命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Vite 和 Electron 开发环境 |
| `npm run build` | TypeScript 检查并构建前端 |
| `npm run preview` | 预览生产前端资源 |
| `npm run mock:monitor` | 启动本地实时状态模拟器 |
| `npm run icon:render` | 使用 Electron 重新生成 PNG 图标 |
| `npm run dist` | 构建当前平台桌面安装包 |
| `npm run dist:win` | 构建 Windows 包 |
| `npm run dist:linux` | 构建 Linux 包 |
| `npm run dist:mac` | 构建 macOS 包 |
| `npm run pack:win` | 不重复构建前端，直接生成 Windows 包 |
| `npm run pack:linux` | 不重复构建前端，直接生成 Linux 包 |
| `npm run pack:mac` | 不重复构建前端，直接生成 macOS 包 |

## 项目结构

```text
ArborFlow/
├─ electron/          Electron 主进程与 preload
├─ public/            公共静态资源
├─ scripts/           Mock Monitor 与图标生成脚本
├─ src/
│  ├─ components/     节点、属性面板和监视器组件
│  ├─ lib/            XML、布局、校验和运行协议
│  ├─ App.tsx         编辑器主界面与状态管理
│  └─ styles.css      应用样式
├─ build/             应用图标
├─ package.json       npm 与 Electron Builder 配置
└─ README.md
```

## 安全说明

Electron 渲染进程启用了上下文隔离和沙箱，并关闭 Node.js 集成。文件打开与保存通过受限的 preload API 调用主进程完成。

实时监视器只处理节点状态，不会执行服务端发送的脚本。实际机器人网络中仍建议使用受信任的局域网、`wss://` 或其他安全隧道。

## License

本项目使用 MIT License，详见 `LICENSE`。

# ArborFlow

ArborFlow is a cross-platform visual behavior tree editor for BehaviorTree.CPP. It runs as an Electron desktop app on Windows, Linux, and macOS.

## Features

- Drag-and-drop behavior tree canvas with cycle and child-count validation
- BehaviorTree.CPP control, decorator, action, condition, and subtree nodes
- Editable ports and blackboard expressions such as `{goal}`
- Automatic tree layout, minimap, zoom, undo, and redo
- ArborFlow project files (`.arborflow`) and BehaviorTree.CPP v4 XML import/export
- Real-time node monitoring over a direct WebSocket or `rosbridge_server`
- Runtime states: `IDLE`, `RUNNING`, `SUCCESS`, `FAILURE`, and `SKIPPED`

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Run a local status server in another terminal to exercise the monitor without ROS:

```bash
npm run mock:monitor
```

Connect ArborFlow to `ws://127.0.0.1:1667` and the demo tree will cycle through live states.

Build the web assets and type-check the project:

```bash
npm run build
```

Create desktop packages on the current operating system:

```bash
npm run dist
```

Platform-specific targets are available as `npm run dist:win`, `npm run dist:linux`, and `npm run dist:mac`. Electron applications should normally be packaged on the matching host OS, especially for macOS signing.

## Real-time Monitor

Open **Monitor** in the application toolbar and enter either a direct WebSocket endpoint or a `rosbridge_server` endpoint. Node references are matched in this order:

1. ArborFlow node ID, visible in the Inspector
2. Exact display name or registration name
3. Last segment of a slash-separated path

### Direct WebSocket protocol

ArborFlow accepts one JSON object per WebSocket message. A single status event can use any of `nodeId`, `uid`, `node`, `name`, or `path` as the node reference:

```json
{"type":"status","nodeId":"navigate_action","status":"RUNNING","timestamp":1784635200000}
```

Numeric BehaviorTree.CPP status values are supported: `0=IDLE`, `1=RUNNING`, `2=SUCCESS`, `3=FAILURE`, and `4=SKIPPED`.

A full snapshot can update several nodes at once:

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

The client sends `{"type":"subscribe","client":"ArborFlow","protocol":1}` after connecting and a ping every five seconds. A server may return the same timestamp using `{"type":"pong","timestamp":1784635200000}` to report round-trip latency.

### ROS 2 with rosbridge

Start rosbridge and use its WebSocket address, usually `ws://ROBOT_IP:9090`:

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

The default topic is `/arborflow/status` with type `std_msgs/msg/String`. Publish the direct-protocol JSON as the string payload:

```bash
ros2 topic pub --once /arborflow/status std_msgs/msg/String \
  "{data: '{\"node\":\"NavigateToPose\",\"status\":\"RUNNING\"}'}"
```

ArborFlow sends the rosbridge subscribe request automatically. The topic can be changed in the monitor panel.

## Project format

`.arborflow` files retain visual positions, editor metadata, node ports, and stable monitor IDs. XML exports contain only BehaviorTree.CPP data. Runtime monitor state is transient and is never saved into either format.

## License

MIT

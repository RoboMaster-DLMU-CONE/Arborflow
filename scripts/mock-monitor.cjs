const { WebSocketServer } = require('ws')

const port = Number(process.env.ARBORFLOW_MOCK_PORT || 1667)
const server = new WebSocketServer({ port })
const steps = [
  { BatteryOK: 'RUNNING', NavigateToPose: 'IDLE', ReportResult: 'IDLE' },
  { BatteryOK: 'SUCCESS', NavigateToPose: 'RUNNING', ReportResult: 'IDLE' },
  { BatteryOK: 'SUCCESS', NavigateToPose: 'SUCCESS', ReportResult: 'RUNNING' },
  { BatteryOK: 'SUCCESS', NavigateToPose: 'SUCCESS', ReportResult: 'SUCCESS' },
]

server.on('connection', (socket) => {
  let step = 0
  const publish = () => {
    socket.send(JSON.stringify({ type: 'snapshot', timestamp: Date.now(), nodes: steps[step] }))
    step = (step + 1) % steps.length
  }
  const timer = setInterval(publish, 1200)
  publish()

  socket.on('message', (raw) => {
    try {
      const message = JSON.parse(String(raw))
      if (message.type === 'ping') socket.send(JSON.stringify({ type: 'pong', timestamp: message.timestamp }))
    } catch {
      // Ignore non-JSON messages in the development mock.
    }
  })
  socket.on('close', () => clearInterval(timer))
})

console.log(`ArborFlow mock monitor listening on ws://127.0.0.1:${port}`)

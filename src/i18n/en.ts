const en: Record<string, string> = {
  /* ── App Chrome ── */
  'app.subtitle': 'Behavior Tree Studio',

  /* ── Toolbar ── */
  'toolbar.canvas': 'Canvas',
  'toolbar.xml': 'XML',
  'toolbar.autoLayout': 'Auto Layout',
  'toolbar.viewSwitch': 'View Switch',
  'toolbar.monitor': 'Monitor',

  /* ── Header Actions ── */
  'action.newProject': 'New Project',
  'action.openProject': 'Open Project',
  'action.saveProject': 'Save Project',
  'action.undo': 'Undo',
  'action.redo': 'Redo',
  'action.importXml': 'Import XML',
  'action.exportXml': 'Export XML',
  'action.unsaved': 'Unsaved',
  'action.settings': 'Settings',

  /* ── Settings ── */
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.language': 'Language',
  'settings.dark': 'Dark',
  'settings.light': 'Light',
  'settings.langZh': '中文',
  'settings.langEn': 'English',

  /* ── Tree Menu ── */
  'tree.heading': 'Behavior Trees',
  'tree.main': 'MAIN',

  /* ── Node Palette ── */
  'palette.title': 'Nodes',
  'palette.searchPlaceholder': 'Search nodes',
  'palette.customNodes': 'XML Custom Nodes',
  'palette.eyebrow': 'LIBRARY',
  'palette.noMatch': 'No matching nodes',
  'palette.clearSearch': 'Clear search',
  'palette.portCount': '{count} port(s)',
  'palette.customModelAdd': 'Add Custom Node',
  'palette.customModelName': 'Node Name / ID',
  'palette.customModelType': 'Base Type',
  'palette.customModelCreate': 'Create',

  /* ── Node Category Labels ── */
  'cat.control': 'Control',
  'cat.decorator': 'Decorator',
  'cat.action': 'Action',
  'cat.condition': 'Condition',
  'cat.subtree': 'SubTree',
  'cat.root': 'Root',

  /* ── Node Type Names ── */
  'node.Sequence': 'Sequence',
  'node.Fallback': 'Fallback',
  'node.Parallel': 'Parallel',
  'node.ReactiveSequence': 'Reactive Sequence',
  'node.ReactiveFallback': 'Reactive Fallback',
  'node.Inverter': 'Inverter',
  'node.RetryUntilSuccessful': 'Retry',
  'node.Repeat': 'Repeat',
  'node.ForceSuccess': 'Force Success',
  'node.ForceFailure': 'Force Failure',
  'node.Action': 'Action',
  'node.Condition': 'Condition',
  'node.SubTree': 'SubTree',
  'node.AlwaysSuccess': 'Always Success',
  'node.AlwaysFailure': 'Always Failure',
  'node.Root': 'Root',

  /* ── Node Descriptions ── */
  'desc.Sequence': 'Execute children in order, stop on failure',
  'desc.Fallback': 'Try children in order, stop on success',
  'desc.Parallel': 'Execute multiple children in parallel',
  'desc.ReactiveSequence': 'Re-evaluate from first child each tick',
  'desc.ReactiveFallback': 'Reactive fallback control node',
  'desc.Inverter': 'Invert success/failure of child',
  'desc.RetryUntilSuccessful': 'Retry up to N times on failure',
  'desc.Repeat': 'Repeat execution up to N cycles',
  'desc.ForceSuccess': 'Force return success',
  'desc.ForceFailure': 'Force return failure',
  'desc.Action': 'Invoke a ROS action or business logic',
  'desc.Condition': 'Check blackboard or environment condition',
  'desc.SubTree': 'Call another behavior tree',
  'desc.AlwaysSuccess': 'Always return success',
  'desc.AlwaysFailure': 'Always return failure',
  'desc.Root': 'Root node of the behavior tree',

  /* ── Inspector ── */
  'inspector.title': 'INSPECTOR',
  'inspector.treeProps': 'Behavior Tree',
  'inspector.nodeProps': 'Node Properties',
  'inspector.displayName': 'Display Name',
  'inspector.registrationName': 'Registration Name / ID',
  'inspector.nodeType': 'Node Type',
  'inspector.nodeId': 'Runtime Match ID',
  'inspector.ports': 'Ports & Blackboard',
  'inspector.addPort': 'Add Port',
  'inspector.noPorts': 'No ports',
  'inspector.portKey': 'Port name',
  'inspector.portValue': 'Value or {blackboard}',
  'inspector.portDirection': 'Direction',
  'inspector.breakpoint': 'Breakpoint',
  'inspector.breakpointDesc': 'Flag when execution reaches this node',
  'inspector.enterSubtree': 'Enter Subtree',
  'inspector.notes': 'Notes',
  'inspector.deleteNode': 'Delete Node',
  'inspector.structureCheck': 'Structure Check',
  'inspector.projectName': 'Project Name',
  'inspector.mainTreeId': 'Main Tree ID',
  'inspector.nodeCount': 'nodes',
  'inspector.edgeCount': 'edges',
  'inspector.errorCount': 'errors',

  /* ── Modal ── */
  'modal.editNode': 'Edit Node',
  'modal.save': 'Save',
  'modal.cancel': 'Cancel',
  'modal.delete': 'Delete',

  /* ── Validation ── */
  'validation.valid': 'Structure valid',
  'validation.emptyCanvas': 'Canvas is empty, add a root node',
  'validation.missingRoot': 'No root node — tree may contain cycles',
  'validation.tooManyRoots': 'root nodes detected — connect into a single tree before exporting XML',
  'validation.cannotAddChild': 'Cannot add more children',
  'validation.singleParent': 'A node can only have one parent',
  'validation.wouldCycle': 'This connection would create a cycle',
  'validation.xmlEmpty': 'Canvas is empty, cannot export XML',
  'validation.xmlMultiRoot': 'Must have exactly one root node',
  'validation.xmlParseError': 'XML parse error',
  'validation.xmlNoTree': 'No <BehaviorTree> element found',
  'validation.tooManyChildren': 'allowed children',

  /* ── Toast ── */
  'toast.projectOpened': 'Project opened',
  'toast.projectSaved': 'Project saved',
  'toast.projectDownloaded': 'Project downloaded',
  'toast.xmlImported': 'XML imported',
  'toast.xmlExported': 'BehaviorTree.CPP XML exported',
  'toast.xmlCopied': 'XML copied',
  'toast.saveFailed': 'Save failed',
  'toast.openFailed': 'Open project failed',
  'toast.importFailed': 'XML import failed',
  'toast.exportFailed': 'XML export failed',
  'toast.xmlGenFailed': 'Cannot generate XML',

  /* ── Confirm ── */
  'confirm.unsavedNew': 'Unsaved changes. Create new project anyway?',

  /* ── Status Bar ── */
  'status.trees': 'trees',
  'status.nodes': 'nodes',
  'status.edges': 'edges',
  'status.valid': 'Structure valid',
  'status.errors': 'structure errors',
  'status.unsaved': 'Unsaved',
  'status.webPreview': 'Web Preview',
  'status.desktop': 'Desktop',

  /* ── XML View ── */
  'xml.copyButton': 'Copy XML',
  'xml.errorHeading': 'Cannot Generate XML',

  /* ── Monitor ── */
  'monitor.disconnected': 'Disconnected',
  'monitor.connecting': 'Connecting',
  'monitor.connected': 'Connected',
  'monitor.error': 'Connection Error',
  'monitor.eventStream': 'Event Stream',
  'monitor.waiting': 'Waiting for node status',
  'monitor.unmatched': 'Unmatched',
  'monitor.endpoint': 'ROS WebSocket Address',
  'monitor.topic': 'rosbridge Topic',
  'monitor.autoReconnect': 'Auto Reconnect',
  'monitor.disconnect': 'Disconnect',
  'monitor.connect': 'Connect',
  'monitor.messages': 'Messages',
  'monitor.latency': 'Latency',
  'monitor.clearRuntime': 'Clear Runtime Status',
  'monitor.closeMonitor': 'Close Monitor',
  'monitor.matched': 'Matched',
}

export default en

const zh: Record<string, string> = {
  /* ── App Chrome ── */
  'app.subtitle': '行为树编辑器',

  /* ── Toolbar ── */
  'toolbar.canvas': '画布',
  'toolbar.xml': 'XML',
  'toolbar.autoLayout': '自动布局',
  'toolbar.monitor': 'Monitor',

  /* ── Header Actions ── */
  'action.newProject': '新建工程',
  'action.openProject': '打开工程',
  'action.saveProject': '保存工程',
  'action.undo': '撤销',
  'action.redo': '重做',
  'action.importXml': '导入 XML',
  'action.exportXml': '导出 XML',
  'action.settings': '设置',

  /* ── Settings ── */
  'settings.title': '设置',
  'settings.theme': '主题',
  'settings.language': '语言',
  'settings.dark': '深色模式',
  'settings.light': '浅色模式',
  'settings.langZh': '中文',
  'settings.langEn': 'English',

  /* ── Tree Menu ── */
  'tree.heading': '行为树',
  'tree.main': 'MAIN',

  /* ── Node Palette ── */
  'palette.title': '节点',
  'palette.searchPlaceholder': '搜索节点',
  'palette.customNodes': 'XML 自定义节点',
  'palette.noMatch': '没有匹配节点',
  'palette.customModelAdd': '添加自定义节点',
  'palette.customModelName': '节点名称 / ID',
  'palette.customModelType': '基础类型',
  'palette.customModelCreate': '创建',

  /* ── Node Category Labels ── */
  'cat.control': '控制',
  'cat.decorator': '装饰',
  'cat.action': '动作',
  'cat.condition': '条件',
  'cat.subtree': '子树',
  'cat.root': '根',

  /* ── Node Type Names — Bilingual Display ── */
  'node.Sequence': '顺序执行',
  'node.Fallback': '选择回退',
  'node.Parallel': '并行执行',
  'node.ReactiveSequence': '响应序列',
  'node.ReactiveFallback': '响应回退',
  'node.Inverter': '反转',
  'node.RetryUntilSuccessful': '重试',
  'node.Repeat': '重复',
  'node.ForceSuccess': '强制成功',
  'node.ForceFailure': '强制失败',
  'node.Action': '动作',
  'node.Condition': '条件',
  'node.SubTree': '子树',
  'node.AlwaysSuccess': '始终成功',
  'node.AlwaysFailure': '始终失败',
  'node.Root': '根节点',

  /* ── Node Descriptions ── */
  'desc.Sequence': '依次执行子节点，遇失败停止',
  'desc.Fallback': '依次尝试子节点，遇成功停止',
  'desc.Parallel': '并行执行多个子节点',
  'desc.ReactiveSequence': '每次 tick 从头重新评估',
  'desc.ReactiveFallback': '响应式回退控制节点',
  'desc.Inverter': '反转子节点的成功/失败结果',
  'desc.RetryUntilSuccessful': '失败后重试指定次数',
  'desc.Repeat': '重复执行指定次数',
  'desc.ForceSuccess': '强制返回成功状态',
  'desc.ForceFailure': '强制返回失败状态',
  'desc.Action': '调用 ROS 动作或业务逻辑',
  'desc.Condition': '检查黑板变量或环境条件',
  'desc.SubTree': '调用另一棵行为树',
  'desc.AlwaysSuccess': '始终返回成功',
  'desc.AlwaysFailure': '始终返回失败',
  'desc.Root': '行为树的根节点',

  /* ── Inspector ── */
  'inspector.title': 'INSPECTOR',
  'inspector.treeProps': '行为树',
  'inspector.nodeProps': '节点属性',
  'inspector.displayName': '显示名称',
  'inspector.registrationName': '注册名称 / ID',
  'inspector.nodeType': '节点类型',
  'inspector.nodeId': '运行匹配 ID',
  'inspector.ports': '端口与黑板',
  'inspector.addPort': '添加端口',
  'inspector.noPorts': '暂无端口',
  'inspector.portKey': '端口名',
  'inspector.portValue': '值或 {blackboard}',
  'inspector.portDirection': '方向',
  'inspector.breakpoint': '断点',
  'inspector.breakpointDesc': '运行到此节点时标记',
  'inspector.notes': '备注',
  'inspector.deleteNode': '删除节点',
  'inspector.structureCheck': '结构检查',
  'inspector.projectName': '工程名称',
  'inspector.mainTreeId': '主树 ID',
  'inspector.nodeCount': '节点',
  'inspector.edgeCount': '连接',
  'inspector.errorCount': '错误',

  /* ── Modal ── */
  'modal.editNode': '编辑节点',
  'modal.save': '保存',
  'modal.cancel': '取消',
  'modal.delete': '删除',

  /* ── Validation ── */
  'validation.valid': '结构有效',
  'validation.emptyCanvas': '画布为空，请添加根节点',
  'validation.missingRoot': '没有根节点，树中可能存在环路',
  'validation.tooManyRoots': '个根节点，导出 XML 前必须连接为一棵树',
  'validation.cannotAddChild': '不能再添加子节点',
  'validation.singleParent': '一个节点只能有一个父节点',
  'validation.wouldCycle': '此连接会形成环路',
  'validation.xmlEmpty': '画布为空，无法导出 XML',
  'validation.xmlMultiRoot': '必须只有一个根节点',
  'validation.xmlParseError': 'XML 解析失败',
  'validation.xmlNoTree': '未找到 <BehaviorTree> 元素',
  'validation.tooManyChildren': '个允许的子节点',

  /* ── Toast ── */
  'toast.projectOpened': '工程已打开',
  'toast.projectSaved': '工程已保存',
  'toast.projectDownloaded': '工程已下载',
  'toast.xmlImported': 'XML 已导入',
  'toast.xmlExported': 'BehaviorTree.CPP XML 已导出',
  'toast.xmlCopied': 'XML 已复制',
  'toast.saveFailed': '保存失败',
  'toast.openFailed': '打开工程失败',
  'toast.importFailed': '导入 XML 失败',
  'toast.exportFailed': '导出 XML 失败',
  'toast.xmlGenFailed': '无法生成 XML',

  /* ── Confirm ── */
  'confirm.unsavedNew': '当前工程有未保存更改，仍要新建吗？',

  /* ── Status Bar ── */
  'status.trees': '棵树',
  'status.nodes': '节点',
  'status.edges': '连接',
  'status.valid': '结构有效',
  'status.errors': '个结构错误',
  'status.unsaved': '未保存',
  'status.webPreview': 'Web Preview',
  'status.desktop': 'Desktop',

  /* ── XML View ── */
  'xml.copyButton': '复制 XML',

  /* ── Monitor ── */
  'monitor.disconnected': '未连接',
  'monitor.connecting': '连接中',
  'monitor.connected': '已连接',
  'monitor.error': '连接错误',
  'monitor.eventStream': '事件流',
  'monitor.waiting': '等待节点状态',
  'monitor.unmatched': '未匹配',
  'monitor.endpoint': 'ROS WebSocket 地址',
  'monitor.topic': 'rosbridge Topic',
  'monitor.autoReconnect': '自动重连',
  'monitor.disconnect': '断开',
  'monitor.connect': '连接',
  'monitor.messages': '消息',
  'monitor.latency': '延迟',
  'monitor.matched': '匹配',
}

export default zh

"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "zh";

const messages = {
  en: {
    home: "Home", play: "Play", lab: "Lab", history: "History", about: "About", enter: "Enter the dark", openLab: "Open lab",
    subtitle: "Blind Cartographer", taglineA: "Information keeps you alive.", taglineB: "Information gives you away.",
    homeLead: "A probabilistic exploration game about surviving what you cannot see—and what can hear you learning.",
    beliefThesisA: "You do not navigate the map.", beliefThesisB: "You navigate belief.", sensorProof: "Four sensor models. One Bayesian Hunter. Every certainty leaves a trace.",
    daily: "Daily Echo", seed: "Seed", difficulty: "Difficulty", explorer: "Explorer", signal: "Signal", dark: "Dark",
    energy: "Energy", uncertainty: "Uncertainty", signature: "Signature", cores: "Cores", hunter: "Hunter", quiet: "Quiet", disturbance: "Disturbance", searching: "Searching", hunting: "Hunting", contact: "Contact",
    passive: "Listen", ping: "Short ping", sonar: "Active sonar", beacon: "Triangulate", info: "Expected info", cost: "Energy", emitted: "Signal emitted", low: "Low", medium: "Medium", high: "High",
    objective: "Core signal", extraction: "Extraction signal", faint: "Faint", unstable: "Unstable", clear: "Clear", north: "North", east: "East", south: "South", west: "West",
    copySeed: "Copy seed", copied: "Seed copied", copyFailed: "Copy unavailable — select the seed below", restart: "Replay seed", menu: "Leave run", skip: "Skip intro", continue: "Continue", begin: "Estimate position",
    beliefField: "Probabilistic map field", xrayField: "X-Ray true-state replay", canvasError: "The map could not start. Retry, or enable graphics acceleration in your browser.", retryCanvas: "Retry map",
    sessionOnly: "This replay is available for this session only. Browser storage is full or unavailable. Download a backup before reloading or closing this tab.", downloadReplay: "Download replay JSON",
    intro1: "Location unknown", intro2: "Visual system offline", intro3: "Localization failure", intro4: "Three data cores detected", intro5: "Something else is moving",
    tutorialMove: "Move once. Your body may not obey perfectly.", tutorialListen: "Listen without giving much away.", tutorialPing: "Ping the structure. Watch the belief contract.", tutorialSonar: "Use sonar. Learn more—and announce yourself.", tutorialDone: "More information creates more signal.",
    survived: "Survived", lost: "Signal terminated", debrief: "Run debrief", time: "Time", moves: "Moves", scans: "Scans", energyUsed: "Energy used", maxUncertainty: "Max uncertainty", avgUncertainty: "Average uncertainty", informationGain: "Information gained", generated: "Signature generated", contacts: "Contact events", score: "Run score", openReplay: "Open X-Ray replay", newRun: "New run",
    replayTitle: "X-Ray replay", actualMap: "True geometry", playerBelief: "Player belief", hunterBelief: "Hunter belief", scanEvents: "Scan events", playReplay: "Play", pause: "Pause", speed: "Speed", timeline: "Timeline", noReplay: "No replay found", returnHistory: "Open run history",
    labTitle: "Probability laboratory", labLead: "Advance a real particle filter one phase at a time. The white marker is truth; the cloud is belief.", particles: "Particles", motionNoise: "Motion noise", sensorNoise: "Distance sigma", rssiNoise: "RSSI sigma", scanStrength: "Scan strength", priorUncertainty: "Prior uncertainty", falsePositiveRate: "False-positive rate", threshold: "Resample threshold", sensitivity: "Hunter sensitivity", predict: "Predict", observe: "Observe", normalize: "Normalize", resample: "Resample", reset: "Reset", posterior: "Posterior", prior: "Prior", likelihood: "Likelihood", ess: "Effective sample size", math: "Show math", phase: "Filter phase",
    parameters: "Parameters", currentObservation: "Current observation", noObservation: "No observation drawn", infoEmission: "Information / emission", beliefEnergySignal: "Belief / energy / signature",
    historyTitle: "Run archive", historyLead: "Stored on this device. Seeds and replay traces remain available offline.", emptyHistory: "No completed echoes yet.", result: "Result", efficiency: "Info efficiency", replay: "Replay",
    aboutTitle: "A map made of doubt", aboutLead: "ECHO separates the hidden facility from the beliefs held by both player and Hunter. Every visible probability is computed by the same systems that drive the run.",
    playerFilter: "Player localization", hunterModel: "Hunter search", sensorModels: "Sensor models", determinism: "Determinism", accessibility: "Accessibility",
    survival: "Survival", information: "Information", stealth: "Stealth", navigation: "Navigation", truePlayer: "True player", trueHunter: "True Hunter", particleLegend: "Particles", facilityFact: "deterministic facility", sensorsFact: "sensor likelihood models", beliefsFact: "two competing beliefs", moveNorth: "Move north", moveEast: "Move east", moveSouth: "Move south", moveWest: "Move west",
    mute: "Mute generated audio", reduceParticles: "Reduce particle effects", language: "中文", highContrast: "High contrast", debug: "Debug overlay",
    unmute: "Enable generated audio", openNavigation: "Open navigation", closeNavigation: "Close navigation", primaryNavigation: "Primary navigation", mobileNavigation: "Mobile navigation", skipContent: "Skip to content",
    loading: "Reading local echo…", initializing: "Initializing belief field…", restartReplay: "Restart replay", replayTimeline: "Replay timeline", movementControls: "Movement controls", expandDebug: "Open debug telemetry", collapseDebug: "Close debug telemetry",
    footerTagline: "Deterministic probability systems", cooldown: "Cooldown",
  },
  zh: {
    home: "主页", play: "游玩", lab: "实验室", history: "历史", about: "关于", enter: "进入黑暗", openLab: "打开实验室",
    subtitle: "盲眼制图师", taglineA: "信息让你活下去。", taglineB: "信息也会暴露你。", homeLead: "一款关于概率探索的生存游戏：你看不见世界，而某个东西能听见你正在了解它。",
    beliefThesisA: "你并不是在地图上导航。", beliefThesisB: "你在信念中导航。", sensorProof: "四种传感器，一个贝叶斯猎手。每一分确定性都会留下痕迹。",
    daily: "每日回声", seed: "种子", difficulty: "难度", explorer: "探索者", signal: "信号", dark: "深暗",
    energy: "能量", uncertainty: "不确定度", signature: "信号暴露", cores: "数据核心", hunter: "猎手", quiet: "寂静", disturbance: "异常", searching: "搜索中", hunting: "猎杀中", contact: "接触",
    passive: "被动聆听", ping: "短促脉冲", sonar: "主动声呐", beacon: "信标三角定位", info: "预期信息量", cost: "能量", emitted: "发射信号", low: "低", medium: "中", high: "高",
    objective: "核心信号", extraction: "撤离信号", faint: "微弱", unstable: "不稳定", clear: "清晰", north: "北", east: "东", south: "南", west: "西",
    copySeed: "复制种子", copied: "已复制种子", copyFailed: "无法复制，请选中下方种子手动复制", restart: "重玩此种子", menu: "离开本局", skip: "跳过序章", continue: "继续", begin: "估计你的位置",
    beliefField: "概率地图场", xrayField: "X-Ray 真实状态回放", canvasError: "地图未能启动。请重试，或在浏览器设置中开启图形加速。", retryCanvas: "重试地图",
    sessionOnly: "浏览器存储已满或不可用，此回放仅在当前会话中保留。请在刷新或关闭页面前下载备份。", downloadReplay: "下载回放 JSON",
    intro1: "位置未知", intro2: "视觉系统离线", intro3: "定位失败", intro4: "检测到三个数据核心", intro5: "还有某个东西在移动",
    tutorialMove: "移动一次。你的身体不一定完全听从指令。", tutorialListen: "先听。几乎不留下痕迹。", tutorialPing: "向结构发出脉冲，观察信念云收缩。", tutorialSonar: "使用声呐。看得更清楚，也让它听得更清楚。", tutorialDone: "更多信息，会制造更多信号。",
    survived: "成功撤离", lost: "信号终止", debrief: "本局复盘", time: "时间", moves: "移动", scans: "扫描", energyUsed: "消耗能量", maxUncertainty: "最高不确定度", avgUncertainty: "平均不确定度", informationGain: "获得信息", generated: "产生信号", contacts: "接触事件", score: "本局评分", openReplay: "打开 X-Ray 回放", newRun: "开始新一局",
    replayTitle: "X-Ray 回放", actualMap: "真实结构", playerBelief: "玩家信念", hunterBelief: "猎手信念", scanEvents: "扫描事件", playReplay: "播放", pause: "暂停", speed: "速度", timeline: "时间轴", noReplay: "没有找到回放", returnHistory: "打开游戏历史",
    labTitle: "概率实验室", labLead: "逐步运行真实粒子滤波器。白色标记是真实位置，云团是概率信念。", particles: "粒子数量", motionNoise: "移动噪声", sensorNoise: "距离标准差", rssiNoise: "RSSI 标准差", scanStrength: "扫描强度", priorUncertainty: "先验不确定度", falsePositiveRate: "误报率", threshold: "重采样阈值", sensitivity: "猎手灵敏度", predict: "预测", observe: "观测", normalize: "归一化", resample: "重采样", reset: "重置", posterior: "后验", prior: "先验", likelihood: "似然", ess: "有效样本数", math: "显示公式", phase: "滤波阶段",
    parameters: "参数", currentObservation: "当前观测", noObservation: "尚未获取观测", infoEmission: "信息 / 发射", beliefEnergySignal: "信念 / 能量 / 信号",
    historyTitle: "运行档案", historyLead: "保存在本机。种子和回放轨迹可离线查看。", emptyHistory: "还没有完成的回声。", result: "结果", efficiency: "信息效率", replay: "回放",
    aboutTitle: "一张由怀疑绘成的地图", aboutLead: "ECHO 将隐藏设施与玩家、Hunter 各自的信念严格分离。界面里每一个概率都来自真正驱动游戏的系统。",
    playerFilter: "玩家定位", hunterModel: "猎手搜索", sensorModels: "传感器模型", determinism: "确定性", accessibility: "无障碍",
    survival: "生存", information: "信息", stealth: "隐蔽", navigation: "导航", truePlayer: "真实玩家", trueHunter: "真实猎手", particleLegend: "粒子", facilityFact: "确定性设施", sensorsFact: "传感器似然模型", beliefsFact: "两套竞争信念", moveNorth: "向北移动", moveEast: "向东移动", moveSouth: "向南移动", moveWest: "向西移动",
    mute: "静音合成音效", reduceParticles: "减少粒子效果", language: "EN", highContrast: "高对比度", debug: "调试层",
    unmute: "开启合成音效", openNavigation: "打开导航", closeNavigation: "关闭导航", primaryNavigation: "主导航", mobileNavigation: "移动端导航", skipContent: "跳到主要内容",
    loading: "正在读取本地回声…", initializing: "正在初始化信念场…", restartReplay: "重新播放回放", replayTimeline: "回放时间轴", movementControls: "移动控制", expandDebug: "打开调试遥测", collapseDebug: "关闭调试遥测",
    footerTagline: "确定性概率系统", cooldown: "冷却",
  },
} as const;

type MessageKey = keyof typeof messages.en;

type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("echo-locale");
      if (stored === "en" || stored === "zh") {
        setLocaleState(stored);
        document.documentElement.lang = stored === "zh" ? "zh-CN" : "en";
      }
    } catch { /* Language switching stays available when storage is blocked. */ }
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try { window.localStorage.setItem("echo-locale", next); } catch { /* Keep the choice for this session. */ }
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => messages[locale][key] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

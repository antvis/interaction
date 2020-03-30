import EventEmiter from '@antv/event-emitter';
import { LooseObject } from './types';

export type InteractonConstructor = (context: IInteractionContext, steps: InteractionSteps) => void;

export interface IInteraction {
  /**
   * 绑定事件
   * @param source 事件源
   */
  bind(source: EventEmiter);
  /**
   * 解除绑定
   * @param source 事件源
   */
  unbind(source: EventEmiter);
  /**
   * 销毁
   */
  destroy();
}

/** 交互反馈的定义 */
export interface IAction {
  /**
   * 交互 action (反馈)的名称
   */
  name: string;
  /**
   * 上下文
   */
  context: IInteractionContext;
  /**
   * 初始化
   */
  init();
  /**
   * 销毁函数
   */
  destroy();
}

/** 交互上下文的接口定义 */
export interface IInteractionContext extends LooseObject {
  /** 事件对象 */
  event: LooseObject;
  /**
   * 当前的触发源
   */
  source: EventEmiter;

  /** 交互相关的 Actions */
  actions: IAction[];
  /**
   * 缓存属性，用于上下文传递信息
   * @param key 键名
   * @param value 值
   */
  cache(key: string, value?: any);
  /**
   * 获取 action
   * @param name - action 的名称
   * @returns 指定 name 的 Action
   */
  getAction(name): IAction;
  /**
   * 添加 action
   * @param action 指定交互 action
   */
  addAction(action: IAction);
  /**
   * 移除 action
   * @param action 移除的 action
   */
  removeAction(action: IAction);
  /**
   * 销毁
   */
  destroy();
}

export type ActionCallback = (context: IInteractionContext) => void;

/** 交互环节的定义 */
export interface InteractionStep {
  /**
   * 触发事件，支持 view，chart 的各种事件，也支持 document、window 的事件
   */
  trigger: string;
  /**
   * 是否可以触发 action
   * @param context - 交互的上下文
   */
  isEnable?: (context: IInteractionContext) => boolean;
  /**
   * 反馈，支持三种方式：
   * - action:method : action 的名字和方法的组合
   * - [’action1:method1‘, ’action2:method‘]
   * - ActionCallback: 回调函数
   */
  action: string | string[] | ActionCallback;
  /**
   * 回调函数，action 执行后执行
   */
  callback?: (context: IInteractionContext) => void;
  /**
   * @private
   * 不需要用户传入，通过上面的属性计算出来的属性
   */
  actionObject?: ActionObject | ActionObject[];
  /**
   * 在一个环节内是否只允许执行一次
   */
  once?: boolean;
  /**
   * 是否增加节流
   */
  throttle?: ThrottleOption;
  /**
   * 是否延迟
   */
  debounce?: DebounceOption;
}

// action 执行时支持 debounce 和 throttle，可以参考：https://css-tricks.com/debouncing-throttling-explained-examples/
/**
 * debounce 的配置
 */
export interface DebounceOption {
  /**
   * 等待时间
   */
  wait: number;
  /**
   * 是否马上执行
   */
  immediate?: boolean;
}

/**
 * throttle 的配置
 */
export interface ThrottleOption {
  /**
   * 等待时间
   */
  wait: number;
  /**
   * 马上就执行
   */
  leading?: boolean;
  /**
   * 执行完毕后再执行一次
   */
  trailing?: boolean;
}

/** 缓存 action 对象，仅用于当前文件 */
export interface ActionObject {
  /**
   * 缓存的 action
   */
  action: IAction;
  /**
   * action 的方法
   */
  methodName: string;
}

/** 交互的所有环节 */
export interface InteractionSteps {
  /**
   * 显示交互可以进行
   */
  showEnable?: InteractionStep[];
  /**
   * 交互开始
   */
  start?: InteractionStep[];
  /**
   * 交互持续
   */
  processing?: InteractionStep[];
  /**
   * 交互结束
   */
  end?: InteractionStep[];
  /**
   * 交互回滚
   */
  rollback?: InteractionStep[];
}

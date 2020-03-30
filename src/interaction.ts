import EventEmitter from '@antv/event-emitter';
import { debounce, each, isArray, isFunction, isString, throttle } from '@antv/util';
import { createAction, createCallbackAction } from './action/register';
import { ActionObject, IInteraction, IInteractionContext, InteractionStep, InteractionSteps } from './interfaces';
import { LooseObject } from './types';

// 将字符串转换成 action
function parseAction(actionStr: string, context: IInteractionContext): ActionObject {
  const arr = actionStr.split(':');
  const actionName = arr[0];
  // 如果已经初始化过 action ，则直接引用之前的 action
  const action = context.getAction(actionName) || createAction(actionName, context);
  if (!action) {
    throw new Error(`There is no action named ${actionName}`);
  }
  const methodName = arr[1];
  return {
    action,
    methodName,
  };
}

// 执行 Action
function executeAction(actionObject: ActionObject) {
  const { action, methodName } = actionObject;
  if (action[methodName]) {
    action[methodName]();
  } else {
    throw new Error(`Action(${action.name}) doesn't have a method called ${methodName}`);
  }
}

const STEP_NAMES = {
  START: 'start',
  SHOW_ENABLE: 'showEnable',
  END: 'end',
  ROLLBACK: 'rollback',
  PROCESSING: 'processing',
};

/**
 * 支持语法的交互类
 */
export default class Interaction implements IInteraction {
  /** 当前执行到的阶段 */
  public currentStepName: string;
  /**
   * 当前交互的上下文
   */
  public context: IInteractionContext;
  // 存储的交互环节
  private steps: InteractionSteps;
  private source: EventEmitter;

  private callbackCaches: LooseObject = {};
  // 某个触发和反馈在本环节是否执行或
  private emitCaches: LooseObject = {};

  constructor(context: IInteractionContext, steps: InteractionSteps) {
    this.steps = steps;
    this.context = context;
    this.init();
  }

  /**
   * 清理资源
   */
  public destroy() {
    if (this.source) {
      this.unbind(this.source);
    }
    this.steps = null;
    if (this.context) {
      this.context.destroy();
      this.context = null;
    }

    this.callbackCaches = null;
    this.source = null;
  }

  /**
   * 绑定事件
   */
  public bind(source: EventEmitter) {
    // 如果已经绑定，则不再处理
    if (this.source === source) {
      return;
    }
    if (this.source) {
      // 如果已经存在绑定的事件源，则移除掉
      this.unbind(this.source);
    }
    this.source = source;
    this.context.source = source;
    if (source) {
      // 防止 source == null
      each(this.steps, (stepArr, stepName) => {
        each(stepArr, (step) => {
          const callback = this.getActionCallback(stepName, step);
          // 如果存在 callback，才绑定，有时候会出现无 callback 的情况
          if (callback) {
            this.bindEvent(source, step.trigger, callback);
          }
        });
      });
    }
  }

  /**
   * 清理绑定的事件
   */
  public unbind(source: EventEmitter) {
    if (this.source === source) {
      // 解除绑定对象的引用
      this.source = null;
      this.context.source = null;
      each(this.steps, (stepArr, stepName) => {
        each(stepArr, (step) => {
          const callback = this.getActionCallback(stepName, step);
          if (callback) {
            this.offEvent(source, step.trigger, callback);
          }
        });
      });
    }
  }

  /**
   * 初始化
   */
  protected init() {
    this.initContext();
  }

  // 初始化上下文，并初始化 action
  private initContext() {
    const context = this.context;
    const steps = this.steps;
    // 生成具体的 Action
    each(steps, (subSteps) => {
      each(subSteps, (step) => {
        if (isFunction(step.action)) {
          // 如果传入回调函数，则直接生成 CallbackAction
          step.actionObject = {
            action: createCallbackAction(step.action, context),
            methodName: 'execute',
          };
        } else if (isString(step.action)) {
          // 如果是字符串
          step.actionObject = parseAction(step.action, context);
        } else if (isArray(step.action)) {
          // 如果是数组
          const actionArr = step.action;
          step.actionObject = [];
          each(actionArr, (actionStr) => {
            step.actionObject.push(parseAction(actionStr, context));
          });
        }
        // 如果 action 既不是字符串，也不是函数，则不会生成 actionObject
      });
    });
  }

  // 是否允许指定阶段名称执行
  private isAllowStep(stepName: string): boolean {
    const currentStepName = this.currentStepName;
    const steps = this.steps;
    // 相同的阶段允许同时执行
    if (currentStepName === stepName) {
      return true;
    }

    if (stepName === STEP_NAMES.SHOW_ENABLE) {
      // 示能在整个过程中都可用
      return true;
    }

    if (stepName === STEP_NAMES.PROCESSING) {
      // 只有当前是 start 时，才允许 processing
      return currentStepName === STEP_NAMES.START;
    }

    if (stepName === STEP_NAMES.START) {
      // 如果当前是 processing，则无法 start，必须等待 end 后才能执行
      return currentStepName !== STEP_NAMES.PROCESSING;
    }

    if (stepName === STEP_NAMES.END) {
      return currentStepName === STEP_NAMES.PROCESSING || currentStepName === STEP_NAMES.START;
    }

    // if (stepName === STEP_NAMES.ROLLBACK) { // 只剩下了 rollback
    if (steps[STEP_NAMES.END]) {
      // 如果定义了 end, 只有 end 时才允许回滚
      return currentStepName === STEP_NAMES.END;
    } else if (currentStepName === STEP_NAMES.START) {
      // 如果未定义 end, 则判断是否是开始
      return true;
    }
    // }
    // return false;
  }

  // 具体的指定阶段是否允许执行
  private isAllowExcute(stepName: string, step: InteractionStep): boolean {
    if (this.isAllowStep(stepName)) {
      const key = this.getKey(stepName, step);
      // 如果是在本环节内仅允许触发一次，同时已经触发过，则不允许再触发
      if (step.once && this.emitCaches[key]) {
        return false;
      }
      // 如果是允许的阶段，则验证 isEnable 方法
      if (step.isEnable) {
        return step.isEnable(this.context);
      }
      return true; // 如果没有 isEnable 则允许执行
    }
    return false;
  }

  private enterStep(stepName: string) {
    this.currentStepName = stepName;
    this.emitCaches = {}; // 清除所有本环节触发的缓存
  }

  // 执行完某个触发和反馈（子环节）
  private afterExecute(stepName: string, step) {
    // show enable 不计入正常的流程，其他情况则设置当前的 step
    if (stepName !== STEP_NAMES.SHOW_ENABLE && this.currentStepName !== stepName) {
      this.enterStep(stepName);
    }
    const key = this.getKey(stepName, step);
    // 一旦执行，则缓存标记为，一直保持到跳出改环节
    this.emitCaches[key] = true;
  }
  // 获取某个环节的唯一的键值
  private getKey(stepName, step) {
    return stepName + step.trigger + step.action;
  }

  // 获取 step 的回调函数，如果已经生成，则直接返回，如果未生成，则创建
  private getActionCallback(stepName: string, step: InteractionStep): (e: object) => void {
    const context = this.context;
    const callbackCaches = this.callbackCaches;
    const actionObject = step.actionObject;
    if (step.action && actionObject) {
      const key = this.getKey(stepName, step);
      if (!callbackCaches[key]) {
        // 动态生成执行的方法，执行对应 action 的名称
        const actionCallback = (event) => {
          context.event = event;
          if (this.isAllowExcute(stepName, step)) {
            // 如果是数组时，则依次执行
            if (isArray(actionObject)) {
              each(actionObject, (obj: ActionObject) => {
                executeAction(obj);
              });
            } else {
              executeAction(actionObject);
            }
            this.afterExecute(stepName, step);
            if (step.callback) {
              step.callback(context);
            }
          } else {
            // 如果未通过验证，则事件不要绑定在上面
            context.event = null;
          }
        };
        // 如果设置了 debounce
        if (step.debounce) {
          callbackCaches[key] = debounce(actionCallback, step.debounce.wait, step.debounce.immediate);
        } else if (step.throttle) {
          // 设置 throttle
          callbackCaches[key] = throttle(actionCallback, step.throttle.wait, {
            leading: step.throttle.leading,
            trailing: step.throttle.trailing,
          });
        } else {
          // 直接设置
          callbackCaches[key] = actionCallback;
        }
      }
      return callbackCaches[key];
    }
    return null;
  }

  private bindEvent(source: EventEmitter, eventName, callback) {
    const nameArr = eventName.split(':');
    if (nameArr[0] === 'window') {
      window.addEventListener(nameArr[1], callback);
    } else if (nameArr[0] === 'document') {
      document.addEventListener(nameArr[1], callback);
    } else {
      source.on(eventName, callback);
    }
  }

  private offEvent(source: EventEmitter, eventName, callback) {
    const nameArr = eventName.split(':');
    if (nameArr[0] === 'window') {
      window.removeEventListener(nameArr[1], callback);
    } else if (nameArr[0] === 'document') {
      document.removeEventListener(nameArr[1], callback);
    } else {
      source.off(eventName, callback);
    }
  }
}

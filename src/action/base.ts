import { assign } from '@antv/util';
import { IAction, IInteractionContext } from '../interfaces';
import { LooseObject } from '../types';
/**
 * Action 的基类
 */
class Action implements IAction {
  /** Action 名字 */
  public name;
  /** 上下文对象 */
  public context: IInteractionContext;
  /** Action 配置 */
  protected cfg: LooseObject;

  constructor(context: IInteractionContext, cfg?: LooseObject) {
    this.context = context;
    this.cfg = cfg;
    context.addAction(this);
  }

  /**
   * Inits action，提供给子类用于继承
   */
  public init() {
    this.applyCfg(this.cfg);
  }

  /**
   * Destroys action
   */
  public destroy() {
    // 移除 action
    this.context.removeAction(this);
    // 清空
    this.context = null;
  }

  /**
   * 设置配置项传入的值
   * @param cfg
   */
  protected applyCfg(cfg) {
    assign(this, cfg);
  }
}

export default Action;

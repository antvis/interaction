import EventEmitter from '@antv/event-emitter';
import { each, get } from '@antv/util';
import { IAction, IInteractionContext } from './interfaces';
import { LooseObject } from './types';

/**
 * 交互的上下文
 */
export default class Context implements IInteractionContext {
  /** 当前所有的 Action */
  public actions: IAction[] = [];
  /** 当前 View 实例 */
  public source: EventEmitter;
  /** 当前事件对象 */
  public event: LooseObject = null;

  private cacheMap: LooseObject = {};

  /**
   * 缓存信息
   * @param params 缓存的字段
   *  - 如果一个字段则获取缓存
   *  - 两个字段则设置缓存
   */
  public cache(...params) {
    if (params.length === 1) {
      return this.cacheMap[params[0]];
    } else if (params.length === 2) {
      this.cacheMap[params[0]] = params[1];
    }
  }

  /**
   * 获取 Action
   * @param name Action 的名称
   */
  public getAction(name: string): IAction {
    return this.actions.find((action) => action.name === name);
  }

  /**
   * 获取 Action
   * @param action Action 对象
   */
  public addAction(action: IAction) {
    this.actions.push(action);
  }

  /**
   * 移除 Action
   * @param action Action 对象
   */
  public removeAction(action: IAction) {
    const actions = this.actions;
    const index = this.actions.indexOf(action);
    if (index >= 0) {
      actions.splice(index, 1);
    }
  }

  /**
   * 销毁
   */
  public destroy() {
    this.source = null;
    this.event = null;
    // 先销毁 action 再清空，一边遍历，一边删除，所以数组需要更新引用
    each(this.actions.slice(), (action) => {
      action.destroy();
    });
    this.actions = null;
    this.cacheMap = null;
  }
}

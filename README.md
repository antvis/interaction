# Interaction

## 使用

```js
import { registerInteraction, createInteraction} from '@antv/interaction';
registerInteraction('my-interaction', {
  start: [
    {trigger: 'mouseenter', action: 'element-active:active'}
  ]
});

const interaction = createInteraction('my-interaction'); 
interaction.bind(chart);
interaction.unbind(chart);
interaction.destroy();
```

## API

### Interaction
构造函数：
```js
// 用户可以定义自己的 Context 
new Interaction(new Context(), steps);

```

方法有: 
* bind(source: EventEmitter) 绑定事件源
* unbind(source: EventEmitter) 解除事件源绑定
* destroy() 销毁

### Context 

提供了 IContext 接口，其定义为：

```js
/** 交互上下文的接口定义 */
export interface IInteractionContext {
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
```



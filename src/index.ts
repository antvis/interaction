import { lowerCase } from '@antv/util';
import Context from './context';
import Interaction from './interaction';
import { IInteractionContext, InteractionSteps, InteractonConstructor } from './interfaces';
import { LooseObject } from './types';
const Interactions: LooseObject = {};

/**
 * 根据交互行为名字获取对应的交互类
 * @param name 交互名字
 * @returns 交互类
 */
export function getInteraction(name: string): InteractionSteps | InteractonConstructor {
  return Interactions[lowerCase(name)];
}

/**
 * 注册交互行为
 * @param name 交互行为名字
 * @param interaction 交互类
 */
export function registerInteraction(name: string, interaction: InteractionSteps | InteractonConstructor) {
  Interactions[lowerCase(name)] = interaction;
}

export function createInteraction(name: string, context?: IInteractionContext) {
  const steps = this.getInteraction(name);
  if (!steps) {
    return null;
  }
  // 用户有可能传入 context
  if (!context) {
    context = new Context();
  }
  return new Interaction(context, steps);
}

export { Context, Interaction };
export { Action, registerAction, getActionClass } from './action';

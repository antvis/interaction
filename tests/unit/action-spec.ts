
import ActionBase from '../../src/action/base';
import {createAction, getActionClass, registerAction} from '../../src/action/index';
import { createCallbackAction, unregisterAction } from '../../src/action/register';
import Context from '../../src/context';

class MyAction extends ActionBase {

}

describe('register action', () => {
  it('register', () => {
    registerAction('my-action', MyAction);
    expect(getActionClass('my-action')).toBe(MyAction);
  });
  it('create action', () => {
    const context = new Context();
    const action = createAction('my-action', context);
    expect(action.name).toBe('my-action');
    expect( action instanceof MyAction).toBe(true);
    action.destroy();
    expect(action.context).toBe(null);
  });
  it('with cfg', () => {
    registerAction('test-action', MyAction, {a: '123'});
    const context = new Context();
    const action = createAction('test-action', context);
    // @ts-ignore
    expect(action.cfg).toEqual({a: '123'});
    action.init();
    // @ts-ignore
    expect(action.a).toBe('123');
  });
  it('create callback action', () => {
    const context = new Context();
    const action = createCallbackAction((c) => {
      c.cache('a', 'a1');
    }, context);
    expect(context.actions.length).toBe(1);
    action.execute();
    expect(context.cache('a')).toBe('a1');
    context.destroy();
    expect(action.context).toBe(null);
  });
  it('unregisterAction', () => {
    unregisterAction('test-action');
    expect(getActionClass('test-action')).toBe(undefined);
  });
});
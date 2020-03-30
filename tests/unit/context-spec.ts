import ActionBase from '../../src/action/base';
import Context from '../../src/context';

class TestAction extends ActionBase {

}

describe('context test', () => {
  const context = new Context();
  const context1 = new Context();
  it('init', () => {
    expect(context.actions.length).toBe(0);
  });

  it('add action', () => {
    const action = new TestAction(context);
    action.name = 'test';
    expect(context.actions.length).toBe(1);
    expect(context.actions[0]).toBe(action);
    expect(context.getAction('test')).toBe(action);
    expect(context.getAction('a')).toBe(undefined);
    action.destroy();
    expect(context.actions.length).toBe(0);
  });

  it('remove action', () => {
    const action = new TestAction(context);
    action.name = 'test';
    const action1 = new TestAction(context1);
    expect(context.actions.length).toBe(1);
    context.removeAction(action1);
    expect(context.actions.length).toBe(1);
    context.removeAction(action);
    expect(context.actions.length).toBe(0);
    expect(context.getAction('test')).toBe(undefined);
  });

  it('cache', () => {
    context.cache('a', '123');
    expect(context.cache('a')).toBe('123');
    context.cache();
    context.cache('1', 2, 3);
    expect(context.cache('1')).toBe(undefined);
  });

  it('destory', () => {
    const action = new TestAction(context);
    action.name = 'test';
    context.destroy();
    expect(action.context).toBe(null);
    expect(context.actions).toBe(null);
  });
});

import {Action,registerAction} from '../../src/action/index';
import {Context, createInteraction, getInteraction, registerInteraction} from '../../src/index';

class TestAction extends Action {
  public test() {

  }
}
registerAction('test', TestAction);
describe('test interaction register', () => {
  it('register', () => {
    registerInteraction('my-test', {
      start: [{trigger: 'mousedown', action: 'test:abc'}]
    });
    expect(getInteraction('my-test')).not.toBe(undefined);
    expect(getInteraction('sss')).toBe(undefined);
    const interaction = createInteraction('my-test');
    expect(interaction.context).not.toBe(null);
  });
  it('create', () => {
    registerInteraction('test', {
      start: [{trigger: 'mousedown', action: 'test:test'}]
    });
    const context = new Context();
    const interaction = createInteraction('test', context);
    expect(interaction).not.toBe(null);
    expect(interaction.context).toBe(context);
  });

  it('create null', () => {
    const interaction = createInteraction('sss');
    expect(interaction).toBe(null);
  });
});
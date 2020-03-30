
import {Action,registerAction} from '../../src/action/index';
import Context from '../../src/context';
import Interaction from '../../src/interaction';
import View from '../view';

class CustomAction extends Action {
  public readonly name = 'custom';
  public running: boolean = false;
  public isReset: boolean = false;
  public isProcessing: boolean = false;
  public start() {
    this.running = true;
    this.isReset = false;
  }

  public processing() {
    this.isProcessing = true;
  }

  public end() {
    this.running = false;
  }
  public reset() {
    this.running = false;
    this.isReset = true;
  }
}
registerAction('custom', CustomAction);

describe('test simple interaction', () => {
  const chart = new View();
  const interaction = new Interaction(new Context(), {
    start: [{ trigger: 'mouseenter', action: 'custom:start' }],
    processing: [{trigger: 'mousemove', action: 'custom:processing'}],
    end: [{ trigger: 'mouseleave', action: 'custom:end' }],
  });

  it('init interaction', () => {
    interaction.bind(chart);
    const context = interaction.context;
    expect(context.actions.length).toBe(1);
    expect(context.getAction('custom')).not.toBe(undefined);
    expect(context.actions[0].name).toBe('custom');
  });
  it('start', () => {
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.running).toBe(false);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    expect(context.event).toBe(eventObject);
    expect(action.running).toBe(true);
  });
  it('processing', () => {
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.isProcessing).toBe(false);

    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mousemove', eventObject);
    expect(action.isProcessing).toBe(true);
  });
  it('end', () => {
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.running).toBe(true);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseleave', eventObject);
    expect(context.event).toBe(eventObject);
    expect(action.running).toBe(false);
  });
  it('first emit end', () => {
    interaction.currentStepName = null; // 未进行
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.running).toBe(false);
    action.running = true;
    chart.emit('mouseleave', {}); // 未开始时，不执行结束
    expect(action.running).toBe(true);
    chart.emit('mouseenter', {});
    chart.emit('mouseleave', {});
    expect(action.running).toBe(false);
  });
  it('bind and unbind', () => {
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.running).toBe(false);
    interaction.unbind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    expect(context.event).not.toBe(eventObject);
    expect(action.running).toBe(false);
    expect(context.source).toBe(null);
    interaction.bind(chart);
    chart.emit('mouseenter', eventObject);
    expect(context.event).toBe(eventObject);
    expect(action.running).toBe(true);
  });
  it('destroy', () => {
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    interaction.destroy();
    expect(context.actions).toBe(null);
    expect(action.context).toBe(null);
  });
});

describe('with rollback', () => {
  const chart = new View();
  it('no end', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:start' }],
      rollback: [{ trigger: 'click', action: 'custom:reset' }],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('click', eventObject);
    expect(context.event).toBe(null);
    expect(action.isReset).toBe(false);
    chart.emit('mouseenter', eventObject);
    expect(context.event).toBe(eventObject);
    expect(action.running).toBe(true);
    action.running = false; // 反复执行
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    expect(action.isReset).toBe(false);
    chart.emit('click', eventObject);
    expect(action.isReset).toBe(true);
    interaction.destroy();
  });
  it('with end', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:start' }],
      end: [{ trigger: 'mouseleave', action: 'custom:end' }],
      rollback: [{ trigger: 'click', action: 'custom:reset' }],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(false);
    chart.emit('click', eventObject);
    expect(action.running).toBe(false);
    expect(action.isReset).toBe(false);

    // 跳过 end ，无法触发 rollback
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    chart.emit('click', eventObject);
    expect(action.running).toBe(true);
    expect(action.isReset).toBe(false);

    // 只有执行了 end，才能 rollback
    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(false);
    chart.emit('click', eventObject);
    expect(action.isReset).toBe(true);
    interaction.destroy();
  });

  it('isEnable', () => {
    let enable = false;
    const interaction = new Interaction(new Context(),  {
      start: [
        {
          trigger: 'mouseenter',
          isEnable() {
            return enable;
          },
          action: 'custom:start',
        },
      ],
      end: [{ trigger: 'mouseleave', action: 'custom:end' }],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(false);
    enable = true;
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    interaction.destroy();
  });

  it('callback', () => {
    let called = false;
    const interaction = new Interaction(new Context(),  {
      start: [{ trigger: 'mouseenter', action: 'custom:start' }],
      end: [
        {
          trigger: 'mouseleave',
          action: 'custom:end',
          callback() {
            called = true;
          },
        },
      ],
    });
    interaction.bind(chart);
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(called).toBe(false);
    chart.emit('mouseleave', eventObject);
    expect(called).toBe(true);
    interaction.destroy();
  });

  it('action is funciton', () => {
    const interaction = new Interaction(new Context(),  {
      start: [
        {
          trigger: 'mouseenter',
          action: (c) => {
            c.cache('test', true);
          },
        },
      ],
      end: [
        {
          trigger: 'mouseleave',
          action: (c) => {
            c.cache('test', false);
          },
        },
      ],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(context.cache('test')).toBe(true);

    chart.emit('mouseleave', eventObject);
    expect(context.cache('test')).toBe(false);
    interaction.destroy();
  });

  it('bind multiple times', () => {
    let count = 0;
    const interaction = new Interaction(new Context(),  {
      start: [
        {
          trigger: 'mouseenter',
          action: () => {
            count++;
          },
        },
      ]
    });
    interaction.bind(chart);
    interaction.bind(chart);
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    interaction.bind(null);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    interaction.bind(chart);
    const chart1 = new View();
    interaction.bind(chart1);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    chart1.emit('mouseenter', eventObject);
    expect(count).toBe(2);
    interaction.bind(chart);
    chart1.emit('mouseenter', eventObject);
    expect(count).toBe(2);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(3);
    interaction.unbind(chart1);
    interaction.unbind(null);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(4);
    interaction.destroy();
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(4);
  });
  it('no action', () => {
    const interaction = new Interaction(new Context(),  {
      start: [
        {
          trigger: 'mouseenter',
          action: () => {
            return;
          },
        },
      ],
      showEnable: [
        {trigger: 'mousemove', action: () => {
          
        }}
      ],
      end: [
        {trigger: 'mouseup', action: null}
      ]
    });
    interaction.bind(chart);
    expect(() => {
      chart.emit('mouseup', {});
    }).not.toThrow();
    interaction.unbind(chart);
    interaction.context = null;
    interaction.destroy();
  });

  it('show enable', () => {
    let start = 0;
    let end = 0;
    let showEnable = 0;
    const interaction = new Interaction(new Context(),  {
      start: [
        {
          trigger: 'mouseenter',
          action: () => {
            start ++;
          },
        },
      ],
      showEnable: [
        {trigger: 'mousemove', action: () => {
          showEnable++;
        }}
      ],
      end: [
        {trigger: 'mouseup', action: () => {
          end++;
        }}
      ]
    });
    interaction.bind(chart);
    chart.emit('mousemove', {});
    expect(showEnable).toBe(1);
    chart.emit('mouseup', {});
    expect(end).toBe(0);
    chart.emit('mouseenter', {});
    expect(start).toBe(1);
    chart.emit('mousemove', {});
    expect(showEnable).toBe(2);
    chart.emit('mouseup', {});
    expect(end).toBe(1);
  });
  
});

describe('once', () => {
  const chart = new View();
  it('single start', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:start', once: true }],
    });
    interaction.bind(chart);
   
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    action.running = false;
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(false);
    interaction.destroy();
  });
  it('start and end', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:start', once: true }],
      end: [{ trigger: 'mouseleave', action: 'custom:end', once: true }],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(false);
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    // 反复执行
    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(false);
    action.running = true;
    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(true);
  });

  it('start, end, rollback', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:start'}],
      end: [{ trigger: 'mouseleave', action: 'custom:end', once: true }],
      rollback: [{trigger: 'click', action: 'custom:reset', once: true}]
    });
    
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    const eventObject = {};
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    action.running = false;
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(true);
    chart.emit('click', eventObject);
    expect(action.isReset).toBe(false);

    chart.emit('mouseleave', eventObject);
    expect(action.running).toBe(false);
    chart.emit('click', eventObject);
    expect(action.isReset).toBe(true);
    action.isReset = false;
    chart.emit('click', eventObject);
    expect(action.isReset).toBe(false);
  });
});


export function simulateMouseEvent(dom, type, cfg) {
  const event = new MouseEvent(type, cfg);
  dom.dispatchEvent(event);
}

export function getClientPoint(el: HTMLElement, x: number, y: number) {
  const point = el.getBoundingClientRect();
  return {
    clientX: point.left,
    clientY: point.top,
  };
}

describe('test complex action', () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const chart = new View(div);
  it('action array, no error', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: ['custom:start', 'custom:end'] }],
    });
    interaction.bind(chart);
    const context = interaction.context;
    const action = context.getAction('custom') as CustomAction;
    expect(action.running).toBe(false);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    expect(action.running).toBe(false);
    interaction.destroy();
  });

  it('trigger is window', () => {
    let called = false;
    const interaction = new Interaction(new Context(), {
      start: [
        {
          trigger: 'mouseenter',
          action() {
            called = true;
          },
        },
      ],
      end: [
        {
          trigger: 'window:mouseup',
          action() {
            called = false;
          },
        },
      ],
      rollback: [
        {
          trigger: 'document:dblclick',
          action() {
            called = true;
          },
        },
      ],
    });

    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    expect(called).toBe(true);
    const el = chart.getEl() as HTMLElement;
    const rect = el.getBoundingClientRect();
    simulateMouseEvent(window, 'mouseup', {
      clientX: rect.top + 10,
      clientY: rect.left + 10,
    });
    expect(called).toBe(false);

    simulateMouseEvent(document, 'dblclick', {
      target: div,
      clientX: rect.top + 10,
      clientY: rect.left + 10,
    });
    expect(called).toBe(true);
    interaction.destroy();
    // 测试事件是否已经移除
    simulateMouseEvent(window, 'mouseup', {
      target: div,
      clientX: rect.top + 10,
      clientY: rect.left + 10,
    });
    expect(called).toBe(true);
  });

  it('no action', () => {
    expect(() => {
      const interaction = new Interaction(new Context(), {
        start: [{ trigger: 'mouseenter', action: 'test:start' }],
      });
      interaction.destroy();
    }).toThrow();
  });

  it('no method', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: 'custom:test' }],
    });
    interaction.bind(chart);

    const context = interaction.context;
    expect(context.actions.length).toBe(1);
    const eventObject = {
      x: 332,
      y: 337,
    };
    expect(() => {
      chart.emit('mouseenter', eventObject);
    }).toThrow();
    interaction.destroy();
  });

  it('action is array error', () => {
    expect(() => {
      const interaction =  new Interaction(new Context(), {
        start: [{ trigger: 'mouseenter', action: ['test:start', 'custom:start'] }],
      });
      interaction.destroy();
    }).toThrow();
  });

  it('action array, method error', () => {
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: ['custom:start', 'custom:test'] }],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    expect(() => {
      chart.emit('mouseenter', eventObject);
    }).toThrow();
    interaction.destroy();
  });
});

describe('interaction debounce or throttle', () => {
  const chart = new View();
  it('no debounce, no throttle', () => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(3);
    interaction.destroy();
  });
  it('debounce, immediate = false', (done) => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }, debounce: {wait: 20}}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(0);
    setTimeout(() => {
      expect(count).toBe(1);
      interaction.destroy();
      done();
    }, 25);
  });
  it('debounce, immediate = true', (done) => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }, debounce: {wait: 20, immediate: true}}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    setTimeout(() => {
      expect(count).toBe(1);
      interaction.destroy();
      done();
    }, 25);
  });

  it('throttle', (done) => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }, throttle: {wait: 20}}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    setTimeout(() => {
      expect(count).toBe(2);
      interaction.destroy();
      done();
    }, 25);
  });

  it('throttle trailing = false', (done) => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }, throttle: {wait: 20, trailing: false}}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(1);
    setTimeout(() => {
      expect(count).toBe(1);
      interaction.destroy();
      done();
    }, 25);
  });

  it('throttle leading = false', (done) => {
    let count = 0;
    const interaction = new Interaction(new Context(), {
      start: [{ trigger: 'mouseenter', action: () => {
        count ++;
      }, throttle: {wait: 20, leading: false}}],
    });
    interaction.bind(chart);
    const eventObject = {
      x: 332,
      y: 337,
    };
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    chart.emit('mouseenter', eventObject);
    expect(count).toBe(0);
    setTimeout(() => {
      expect(count).toBe(1);
      interaction.destroy();
      done();
    }, 25);
  });
});




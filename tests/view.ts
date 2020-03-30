import EventEmitter from '@antv/event-emitter';

export default class View extends EventEmitter{
  private container;
  constructor(container?) {
    super();
    this.container = container;
  }

  public getEl() {
    return this.container;
  }
}
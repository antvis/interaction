/**
 * @fileOverview Interaction
 * @author leungwensen@gmail.com
 */

const Interactions = {
  Base: require('./base'),
  Brush: require('./brush'),
  Drag: require('./drag'),
  Zoom: require('./zoom'),
  helper: {
    bindInteraction: require('./helper/bindInteraction')
  }
};

module.exports = Interactions;

'use babel';
// eslint-disable-next-line no-unused-vars
import { React, ReactDOM } from 'react-for-atom';
import Slides from './slides';
import Recording from './recording';

export default function Controls(controller, statusBar) {
  this.controller = controller;
  this.statusBar = statusBar;

  this.root = document.createElement('div');
  this.root.style.display = 'inline-block';
  this.root.style.paddingLeft = '10px';

  this.statusBar.addRightTile({
    item: this.root,
    priority: 1000
  });
  atom.workspace.onDidStopChangingActivePaneItem(this.newRecorder.bind(this));
  this.newRecorder();
}

Controls.prototype.newRecorder = function() {
  this.recorder = this.controller.getCurrentRecorder();
  if (this.recorder) this.recorder.updateListener = this.render.bind(this);
  this.render();
};

Controls.prototype.render = function() {
  if (!this.recorder) return ReactDOM.render(<div />, this.root);

  let {
    slides,
    currentPosition,
    isRecording,
    record,
    pause,
    play
  } = this.recorder;

  ReactDOM.render(
    <div>
      <Slides {...{ slides, currentPosition, play }} />
      <Recording {...{ isRecording, record, pause }} />
    </div>,
    this.root
  );
};

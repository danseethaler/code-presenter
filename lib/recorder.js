'use babel';

export default function Recorder(editor, serialzedState = {}) {
  this.editor = editor;
  this.path = editor.getPath();
  this.updateListener = null;
  this.resetProps(serialzedState);
  this.record = this.record.bind(this);
  this.pause = this.pause.bind(this);
  this.play = this.play.bind(this);
}

Recorder.prototype.resetProps = function(serialzedState = {}) {
  this.slides = serialzedState.slides || [];
  this.startBuffer = null;
  this.currentChanges = [];
  this.listener = null;
  this.currentPosition = 0;
  this.nextPosition = 0;
  this.isPlaying = false;
  this.isRecording = false;
  this.setState();
};

Recorder.prototype.setState = function() {
  if (this.updateListener) this.updateListener();
};

Recorder.prototype.jumpToFinalText = function() {
  if (!this.slides.length) return;
  let slide = this.slides[this.slides.length - 1];

  let lastText = slide.ending;
  this.editor.buffer.setText(lastText);

  let lastPos = getLastPosition(slide.changes);
  if (lastPos) this.editor.setCursorBufferPosition(lastPos);
};

Recorder.prototype.record = function() {
  if (this.isRecording) this.pause();
  this.jumpToFinalText();
  this.isRecording = true;
  this.setState();

  const { buffer } = this.editor;
  this.startBuffer = buffer.getText();
  this.listener = buffer.onDidChangeText(({ changes }) => {
    changes = Array.from(changes);
    var storeChanges = changes.map(
      ({ oldRange, newText, newRange: { end } }) => ({
        oldRange,
        newText,
        end
      })
    );
    this.currentChanges.push(storeChanges);
  });
};

Recorder.prototype.pause = function() {
  if (this.listener) this.listener.dispose();
  this.listener = null;

  this.isRecording = false;
  this.setState();
  var changes = this.currentChanges.splice(0);
  if (!changes || !changes.length) return;

  this.slides.push({
    changes,
    beginning: this.startBuffer,
    ending: this.editor.buffer.getText()
  });

  this.startBuffer = null;
};

Recorder.prototype.cancel = function() {
  if (!this.isRecording) return;
  this.currentChanges.splice(0);
  if (this.listener) this.listener.dispose();
  this.listener = null;
};

// Increment or reset the play position to zero
Recorder.prototype.incrementReplayPosition = function() {
  if (this.nextPosition === 0 && this.currentPosition === 0) {
    this.nextPosition++;
  } else {
    if (!this.slides[++this.currentPosition]) this.currentPosition = 0;
    if (!this.slides[++this.nextPosition]) this.nextPosition = 0;
  }
};

// Increment or reset the play position to zero
Recorder.prototype.decrementReplayPosition = function() {
  this.nextPosition = this.currentPosition;
  if (!this.slides[--this.currentPosition])
    this.currentPosition = this.slides.length - 1;
  this.setState();
};

Recorder.prototype.back = function() {
  if (this.isRecording) this.pause();
  const { buffer } = this.editor;

  if (this.isPlaying) {
    clearTimeout(this.isPlaying);
    this.isPlaying = false;
  }
  if (!this.slides.length) return console.warn('No slides found.');
  let { beginning } = this.slides[this.currentPosition];
  buffer.setText(beginning);

  this.decrementReplayPosition();
  var { changes } = this.slides[this.currentPosition];
  var lastPos = getLastPosition(changes);
  if (lastPos) this.editor.setCursorBufferPosition(lastPos);
  this.setState();
};

function getLastPosition(changes) {
  if (!changes[changes.length - 1].length) return false;
  return changes[changes.length - 1][0].end;
}

Recorder.prototype.play = function() {
  if (this.isRecording) this.pause();
  if (!this.slides.length) return console.warn('Nothing to play');

  const { buffer } = this.editor;
  if (this.isPlaying) {
    clearTimeout(this.isPlaying);
    this.isPlaying = false;

    let { ending, changes } = this.slides[this.currentPosition];
    buffer.setText(ending);
    var lastPos = getLastPosition(changes);
    if (lastPos) this.editor.setCursorBufferPosition(lastPos);

    this.setState();
    return;
  }

  this.incrementReplayPosition();

  if (atom.config.get('code-presenter').skipChanges) {
    let { ending, changes } = this.slides[this.currentPosition];
    buffer.setText(ending);
    var lastPos = getLastPosition(changes);
    if (lastPos) this.editor.setCursorBufferPosition(lastPos);

    this.setState();
    return;
  }

  this.isPlaying = true;

  var { changes, beginning } = this.slides[this.currentPosition];
  changes = [...changes];

  buffer.setText(beginning);
  this.updateText(changes, buffer);
  this.setState();
};

Recorder.prototype.updateText = function(changes, buffer) {
  var change = changes.shift();
  var changeString = '';
  for (const { oldRange, newText, end } of change.reverse()) {
    buffer.setTextInRange(oldRange, newText);
    this.editor.setCursorBufferPosition(end);
    changeString += newText;
  }
  if (changes.length) {
    let { playbackInterval } = atom.config.get('code-presenter');

    if (changeString.length === 0) {
      playbackInterval = 0;
    } else if (changeString.length > 1) {
      playbackInterval = playbackInterval * 3;
    }

    this.isPlaying = setTimeout(() => {
      this.updateText(changes, buffer);
    }, playbackInterval);
  } else {
    this.isPlaying = false;
  }
};

Recorder.prototype.serialize = function() {
  const { slides, path } = this;
  return { slides, path };
};

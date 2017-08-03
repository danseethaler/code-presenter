'use babel';

export default function Recorder(editor, serialzedState = {}) {
  this.editor = editor;
  this.path = editor.getPath();
  this.slides = serialzedState.slides || [];
  this.startBuffer = null;
  this.currentChanges = [];
  this.interval = atom.config.get('code-presenter').playbackInterval;
  this.listener = null;
  this.currentPosition = 0;
  this.nextPosition = 0;
  this.isPlaying = false;
  this.isRecording = false;
}

Recorder.prototype.record = function() {
  if (this.isRecording) this.pause();
  this.isRecording = true;

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
  this.isRecording = false;
  var changes = this.currentChanges.splice(0);
  if (!changes || !changes.length) return;

  this.slides.push({
    changes,
    beginning: this.startBuffer,
    ending: this.editor.buffer.getText()
  });

  this.startBuffer = null;

  if (this.listener) this.listener.dispose();
  this.listener = null;
};

Recorder.prototype.cancel = function() {
  this.currentChanges.splice(0);
  if (this.listener) this.listener.dispose();
  this.listener = null;
};

// Increment or reset the play position to zero
Recorder.prototype.incrementReplayPosition = function() {};

// Increment or reset the play position to zero
Recorder.prototype.decrementReplayPosition = function() {
  this.nextPosition = this.currentPosition;
  if (!this.slides[--this.currentPosition])
    this.currentPosition = this.slides.length - 1;
};

Recorder.prototype.back = function() {
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
};

function getLastPosition(changes) {
  if (!changes[changes.length - 1].length) return false;
  return changes[changes.length - 1][0].end;
}

Recorder.prototype.play = function() {
  if (!this.slides.length) return console.warn('Nothing to play');

  const { buffer } = this.editor;
  if (this.isPlaying) {
    clearTimeout(this.isPlaying);
    this.isPlaying = false;

    let { ending, changes } = this.slides[this.currentPosition];
    buffer.setText(ending);
    var lastPos = getLastPosition(changes);
    if (lastPos) this.editor.setCursorBufferPosition(lastPos);

    return;
  }
  // this.incrementReplayPosition();

  if (this.nextPosition === 0 && this.currentPosition === 0) {
    this.nextPosition++;
  } else {
    if (!this.slides[++this.currentPosition]) this.currentPosition = 0;
    if (!this.slides[++this.nextPosition]) this.nextPosition = 0;
  }
  this.isPlaying = true;

  var { changes, beginning } = this.slides[this.currentPosition];
  changes = [...changes];

  buffer.setText(beginning);
  this.updateText(changes, buffer);
};

Recorder.prototype.updateText = function(changes, buffer) {
  var change = changes.shift();
  for (const { oldRange, newText, end } of change.reverse()) {
    buffer.setTextInRange(oldRange, newText);
    this.editor.setCursorBufferPosition(end);
  }
  if (changes.length) {
    this.isPlaying = setTimeout(() => {
      this.updateText(changes, buffer);
    }, this.interval);
  } else {
    this.isPlaying = false;
  }
};

Recorder.prototype.serialize = function() {
  const { slides, path } = this;
  return { slides, path };
};

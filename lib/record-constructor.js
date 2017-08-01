export default function record(editor) {
  // Check editor constructor to ensure proper object

  this.editorPath = editor.getPath();

  if (!this.editorPath)
    throw new Error('Editor must be saved to a local path!');

  this.editor = editor;
  this.allChanges = [];
  this.beginningBuffers = [];
  this.currentChanges = [];
  this.interval = 30;
  this.listener = null;
}

record.prototype.start = function() {
  this.beginningBuffers.push(this.editor.buffer.getText());
  this.listener = this.editor.buffer.onDidChangeText(({ changes }) => {
    changes = Array.from(changes);
    var storeChanges = changes.map(({ oldRange, newText }) => ({
      oldRange,
      newText
    }));
    this.currentChanges.push(storeChanges);
  });
};

record.prototype.stop = function() {
  this.allChanges.push(this.currentChanges);
  this.listener.dispose();
  this.currentChanges = [];
};

record.prototype.replay = function() {
  var changes = this.allChanges.shift();
  var startText = this.beginningBuffers.shift();
  this.editor.buffer.setText(startText);

  function updateText() {
    var change = changes.shift();
    for (const { oldRange, newText } of change.reverse()) {
      this.editor.buffer.setTextInRange(oldRange, newText);
    }
    if (changes.length) setTimeout(updateText, this.interval);
  }
  updateText();
};

function cleanPath(path) {
  return path.replace(/[^\w\s]/gi, '_');
}

record.prototype.serialize = function() {
  // TODO: Set editor
  var { allChanges, beginningBuffers } = this;

  var serial = { allChanges, beginningBuffers };
  atom.config.set(`code-presenter:${cleanPath(this.editorPath)}`, serial);
};

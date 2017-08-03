'use babel';
import Recorder from './recorder';

export default function Controller(initialState) {
  if (!initialState.recorders) initialState.recorders = [];
  this.initialState = initialState;

  this.getInitialRecorderState = recorderPath =>
    initialState.recorders.find(editor => editor.path === recorderPath) || {};

  this.recorders = [];
}

Controller.prototype.getRecorder = function(recorderPath) {
  return this.recorders.find(({ path }) => path === recorderPath);
};
Controller.prototype.getCurrentEditor = function() {
  var editor = atom.workspace.getActiveTextEditor();
  if (!editor || !editor.getPath) return false;
  if (!editor.getPath()) return false;
  return editor;
};

Controller.prototype.getCurrentRecorder = function() {
  var editor = this.getCurrentEditor();
  if (!editor) return false;
  var editorPath = editor.getPath();

  var recorder = this.getRecorder(editorPath);

  if (!recorder) {
    recorder = new Recorder(editor, this.getInitialRecorderState(editorPath));
    this.recorders.push(recorder);
  }

  return recorder;
};

Controller.prototype.invoke = function(fnName) {
  var recorder = this.getCurrentRecorder();
  if (!recorder) return false;
  recorder[fnName]();
};

Controller.prototype.clear = function() {
  var editor = this.getCurrentEditor();
  if (!editor) return false;

  var editorPath = editor.getPath();

  atom.confirm({
    message: `Clear recordings for ${editorPath}?`,
    // detailedMessage: `Be honest.`,
    buttons: {
      Clear: () => this.clearConfirmed(editorPath),
      Cancel: () => {}
    }
  });
};

Controller.prototype.clearConfirmed = function(editorPath) {
  this.recorders = this.recorders.filter(({ path }) => path !== editorPath);
  this.initialState.recorders = this.initialState.recorders.filter(
    ({ path }) => path !== editorPath
  );
};

Controller.prototype.serialize = function() {
  let currentPaths = this.recorders.map(recorder => recorder.path);

  let initialRecorders = this.initialState.recorders.filter(
    ({ path }) => currentPaths.indexOf(path) < 0
  );

  let serializedRecorders = this.recorders.map(recorder =>
    recorder.serialize()
  );

  return {
    recorders: [...serializedRecorders, ...initialRecorders]
  };
};

'use babel';

import CodePresenterView from './code-presenter-view';
import { CompositeDisposable } from 'atom';

export default {
  codePresenterView: null,
  modalPanel: null,
  subscriptions: null,
  config: {
    playbackInterval: {
      type: 'integer',
      default: '30'
    }
  },

  activate(state) {
    this.codePresenterView = new CodePresenterView(
      state.codePresenterViewState
    );
    // eslint-disable-next-line no-undef
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.codePresenterView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      // eslint-disable-next-line no-undef
      atom.commands.add('atom-workspace', {
        'code-presenter:toggle': () => this.toggle()
      })
    );
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.codePresenterView.destroy();
  },

  serialize() {
    return {
      codePresenterViewState: this.codePresenterView.serialize()
    };
  },

  toggle() {
    console.log('CodePresenter was toggled!');
    return this.modalPanel.isVisible()
      ? this.modalPanel.hide()
      : this.modalPanel.show();
  }
};

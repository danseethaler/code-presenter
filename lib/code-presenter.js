'use babel';

import { CompositeDisposable } from 'atom';
import Controller from './controller';

export default {
  subscriptions: null,
  controller: null,
  shortcutMode: false,
  config: {
    playbackInterval: {
      type: 'integer',
      default: 50
    }
  },

  activate({ controllerState }) {
    this.controller = new Controller(controllerState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(
      // eslint-disable-next-line no-undef
      atom.commands.add('atom-workspace', {
        'code-presenter:shortcut-mode': () => (this.shortcutMode = true),
        'code-presenter:record': () => this.controller.invoke('record'),
        'code-presenter:cancel': () => this.controller.invoke('cancel'),
        'code-presenter:pause': () => this.controller.invoke('pause'),
        'code-presenter:play': () => this.controller.invoke('play'),
        'code-presenter:back': () => this.controller.invoke('back'),
        'code-presenter:clear': () => this.controller.clear(),
        'code-presenter:exit-shortcut-mode': () => (this.shortcutMode = false),
        'code-presenter:auto-record': e => {
          if (!this.shortcutMode) return e.abortKeyBinding();
          this.controller.invoke('record');
        },
        'code-presenter:auto-pause': e => {
          if (!this.shortcutMode) return e.abortKeyBinding();
          this.controller.invoke('pause');
        },
        'code-presenter:auto-play': e => {
          if (!this.shortcutMode) return e.abortKeyBinding();
          this.controller.invoke('play');
        },
        'code-presenter:auto-back': e => {
          if (!this.shortcutMode) return e.abortKeyBinding();
          this.controller.invoke('back');
        }
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {
      controllerState: this.controller.serialize()
    };
  }
};

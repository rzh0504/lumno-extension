const assert = require('assert');
const submitRuntime = require('../src/background/ai-provider-submit.js');

class FakeEvent {
  constructor(type, options) {
    this.type = type;
    Object.assign(this, options || {});
  }
}

class FakeElement {
  constructor(name, env) {
    this.name = name;
    this.env = env;
    this.parentElement = null;
    this.className = '';
    this.disabled = false;
    this.clickCount = 0;
    this.events = [];
    this.attributes = {};
    this._text = '';
  }

  get innerText() {
    return this._text;
  }

  set innerText(value) {
    this._text = String(value || '');
  }

  get textContent() {
    return this._text;
  }

  set textContent(value) {
    this._text = String(value || '');
  }

  get innerHTML() {
    return this._text;
  }

  set innerHTML(value) {
    this._text = String(value || '').replace(/<[^>]*>/g, '');
  }

  getAttribute(name) {
    return this.attributes[name] || '';
  }

  focus() {
    this.env.activeElement = this;
  }

  dispatchEvent(event) {
    this.events.push(event);
    if (this.name === 'editor' && event.type === 'keydown' && event.key === 'Enter') {
      this.env.enterPressed = true;
    }
    return true;
  }

  getBoundingClientRect() {
    if (this.name === 'sendButton' && !this.env.isSendButtonVisible()) {
      return { width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 };
    }
    if (this.name === 'sendButton') {
      return { width: 40, height: 40, top: 92, right: 290, bottom: 132, left: 250 };
    }
    return { width: 280, height: 64, top: 80, right: 300, bottom: 144, left: 20 };
  }

  querySelectorAll(selector) {
    if (selector === 'button,[role="button"]') {
      return [this.env.sendButton];
    }
    return [];
  }

  click() {
    this.clickCount += 1;
  }
}

function withFakePromptDom(callback) {
  const original = {
    document: global.document,
    window: global.window,
    Event: global.Event,
    KeyboardEvent: global.KeyboardEvent,
    InputEvent: global.InputEvent,
    HTMLTextAreaElement: global.HTMLTextAreaElement,
    HTMLInputElement: global.HTMLInputElement,
    setTimeout: global.setTimeout
  };

  const env = {
    activeElement: null,
    enterPressed: false,
    sleepsAfterEnter: 0,
    isSendButtonVisible() {
      return this.enterPressed && this.sleepsAfterEnter > 0;
    }
  };

  const editor = new FakeElement('editor', env);
  const composer = new FakeElement('composer', env);
  const root = new FakeElement('root', env);
  const sendButton = new FakeElement('sendButton', env);
  env.editor = editor;
  env.sendButton = sendButton;
  editor.attributes.role = 'textbox';
  editor.parentElement = composer;
  composer.parentElement = root;

  function queryEditor(selector) {
    return (
      selector.includes('ql-editor') ||
      selector.includes('[contenteditable="true"][role="textbox"]') ||
      selector.includes('div[role="textbox"][contenteditable="true"]')
    );
  }

  global.Event = FakeEvent;
  global.KeyboardEvent = FakeEvent;
  global.InputEvent = FakeEvent;
  global.HTMLTextAreaElement = class HTMLTextAreaElement {};
  global.HTMLInputElement = class HTMLInputElement {};
  global.setTimeout = (done) => {
    if (env.enterPressed) {
      env.sleepsAfterEnter += 1;
    }
    Promise.resolve().then(done);
    return 1;
  };
  global.window = {
    getComputedStyle(element) {
      const visible = element.name !== 'sendButton' || env.isSendButtonVisible();
      return {
        display: visible ? 'block' : 'none',
        visibility: visible ? 'visible' : 'hidden',
        pointerEvents: 'auto',
        opacity: '1'
      };
    },
    getSelection() {
      return {
        removeAllRanges() {},
        addRange() {}
      };
    }
  };
  global.document = {
    querySelectorAll(selector) {
      if (queryEditor(selector)) {
        return [editor];
      }
      return [];
    },
    createRange() {
      return {
        selectNodeContents() {}
      };
    },
    execCommand(command, _showUi, value) {
      if (command === 'insertText' && env.activeElement) {
        env.activeElement.innerText = value;
        return true;
      }
      return false;
    }
  };

  return Promise.resolve()
    .then(() => callback(env))
    .finally(() => {
      global.document = original.document;
      global.window = original.window;
      global.Event = original.Event;
      global.KeyboardEvent = original.KeyboardEvent;
      global.InputEvent = original.InputEvent;
      global.HTMLTextAreaElement = original.HTMLTextAreaElement;
      global.HTMLInputElement = original.HTMLInputElement;
      global.setTimeout = original.setTimeout;
    });
}

function submitWithFakeChrome(strategyName, prompt) {
  const chromeApi = {
    runtime: {},
    scripting: {
      executeScript(details, callback) {
        Promise.resolve(details.func(...details.args))
          .then((result) => callback([{ result }]))
          .catch((error) => callback([{ result: { ok: false, reason: error.message } }]));
      }
    }
  };
  return submitRuntime.submitPromptInTab(chromeApi, 1, prompt, strategyName);
}

async function run() {
  await withFakePromptDom(async (env) => {
    const result = await submitWithFakeChrome('geminiPrompt', 'Explain Lumno');
    assert.strictEqual(result.ok, true);
    assert.strictEqual(
      result.method,
      'enter-button',
      'Gemini should keep watching for a nearby send button after Enter'
    );
    assert.strictEqual(env.sendButton.clickCount, 1, 'Gemini send button should be clicked once it appears');
  });

  console.log('ai provider submit tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

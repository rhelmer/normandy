const {classes: Cc, interfaces: Ci, utils: Cu} = Components;


Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://shield-recipe-client/lib/SandboxManager.jsm", this);
Cu.import("resource://shield-recipe-client/lib/NormandyDriver.jsm", this);
Cu.import("resource://shield-recipe-client/lib/NormandyApi.jsm", this);
Cu.import("resource://shield-recipe-client/lib/Utils.jsm", this);

// Load mocking/stubbing library, sinon
// docs: http://sinonjs.org/docs/
const loader = Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader);
/* global sinon */
loader.loadSubScript("resource://testing-common/sinon-2.3.2.js");

// Make sinon assertions fail in a way that mochitest understands
sinon.assert.fail = function(message) {
  ok(false, message);
};

registerCleanupFunction(async function() {
  // Cleanup window or the test runner will throw an error
  delete window.sinon;
});


this.UUID_REGEX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;

this.withSandboxManager = function(Assert, testFunction) {
  return async function inner() {
    const sandboxManager = new SandboxManager();
    sandboxManager.addHold("test running");

    await testFunction(sandboxManager);

    sandboxManager.removeHold("test running");
    await sandboxManager.isNuked()
      .then(() => Assert.ok(true, "sandbox is nuked"))
      .catch(e => Assert.ok(false, "sandbox is nuked", e));
  };
};

this.withDriver = function(Assert, testFunction) {
  return withSandboxManager(Assert, async function inner(sandboxManager) {
    const driver = new NormandyDriver(sandboxManager);
    await testFunction(driver, sandboxManager);
  });
};

this.withMockNormandyApi = function(testFunction) {
  return async function inner(...args) {
    const mockApi = {actions: [], recipes: [], implementations: {}};

    // Use callsFake instead of resolves so that the current values in mockApi are used.
    mockApi.fetchActions = sinon.stub(NormandyApi, "fetchActions").callsFake(async () => mockApi.actions);
    mockApi.fetchRecipes = sinon.stub(NormandyApi, "fetchRecipes").callsFake(async () => mockApi.recipes);
    mockApi.fetchImplementation = sinon.stub(NormandyApi, "fetchImplementation").callsFake(
      async action => {
        const impl = mockApi.implementations[action.name];
        if (!impl) {
          throw new Error("Missing");
        }
        return impl;
      }
    );

    try {
      await testFunction(mockApi, ...args);
    } finally {
      mockApi.fetchActions.restore();
      mockApi.fetchRecipes.restore();
      mockApi.fetchImplementation.restore();
    }
  };
};

const preferenceBranches = {
  user: Preferences,
  default: new Preferences({defaultBranch: true}),
};

this.withMockPreferences = function(testFunction) {
  return async function inner(...args) {
    const prefManager = new MockPreferences();
    try {
      await testFunction(...args, prefManager);
    } finally {
      prefManager.cleanup();
    }
  };
};

class MockPreferences {
  constructor() {
    this.oldValues = {user: {}, default: {}};
  }

  set(name, value, branch = "user") {
    this.preserve(name, branch);
    preferenceBranches[branch].set(name, value);
  }

  preserve(name, branch) {
    if (!(name in this.oldValues[branch])) {
      const preferenceBranch = preferenceBranches[branch];
      this.oldValues[branch][name] = {
        oldValue: preferenceBranch.get(name),
        existed: preferenceBranch.has(name),
      };
    }
  }

  cleanup() {
    for (const [branchName, values] of Object.entries(this.oldValues)) {
      const preferenceBranch = preferenceBranches[branchName];
      for (const [name, {oldValue, existed}] of Object.entries(values)) {
        if (existed) {
          preferenceBranch.set(name, oldValue);
        } else {
          preferenceBranch.reset(name);
        }
      }
    }
  }
}

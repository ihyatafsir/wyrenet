const { default: runTests, MaladhDiscovery } = require('./src/test/maladhTest.js');
async function test() {
  const m = new MaladhDiscovery();
  const results = [];
  m.activate();
  // Qina
  const b1 = MaladhDiscovery.createTestBeacon('qina'); // Wait, createTestBeacon is not exported
  // Let's just run the test file directly but console.log the results array
}

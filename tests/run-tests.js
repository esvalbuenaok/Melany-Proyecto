"use strict";

var suites = [
  require("./validators.test"),
  require("./filters.test"),
  require("./store.test"),
  require("./flows.test"),
  require("./tangram.test")
];

async function main() {
  var totalTests = 0;
  var totalPassed = 0;
  var totalFailed = 0;

  for (var i = 0; i < suites.length; i++) {
    var res = await suites[i].run();
    totalTests += res.total;
    totalPassed += res.passed;
    totalFailed += res.failed;

    console.log("[" + (res.failed === 0 ? "PASS" : "FAIL") + "] " + res.name + ": " + res.passed + "/" + res.total);
    res.failures.forEach(function (f) {
      console.error("  - " + f.title);
      console.error("    " + (f.error && f.error.stack ? f.error.stack : f.error));
    });
  }

  console.log("----------------------------------------");
  console.log("Total: " + totalPassed + "/" + totalTests + " passed, " + totalFailed + " failed.");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});

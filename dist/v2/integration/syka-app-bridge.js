import { startSykabelajarV2 } from "../bootstrap.js";

/**
 * Bridge between existing loader runtime and Sykabelajar V2.
 *
 * Blogger loader expects window.SYKA_APP.init().
 * This bridge keeps the existing deployment architecture intact.
 */

window.SYKA_APP = {
  async init() {
    return startSykabelajarV2();
  }
};

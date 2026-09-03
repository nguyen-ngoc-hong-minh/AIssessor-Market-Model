/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_billing from "../actions/billing.js";
import type * as actions_planner from "../actions/planner.js";
import type * as actions_recommend from "../actions/recommend.js";
import type * as actions_syncModels from "../actions/syncModels.js";
import type * as actions_trial from "../actions/trial.js";
import type * as analytics from "../analytics.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as modelSync from "../modelSync.js";
import type * as models from "../models.js";
import type * as plannerDiagnostics from "../plannerDiagnostics.js";
import type * as profiles from "../profiles.js";
import type * as strategies from "../strategies.js";
import type * as subscriptions from "../subscriptions.js";
import type * as teams from "../teams.js";
import type * as trials from "../trials.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/billing": typeof actions_billing;
  "actions/planner": typeof actions_planner;
  "actions/recommend": typeof actions_recommend;
  "actions/syncModels": typeof actions_syncModels;
  "actions/trial": typeof actions_trial;
  analytics: typeof analytics;
  crons: typeof crons;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  modelSync: typeof modelSync;
  models: typeof models;
  plannerDiagnostics: typeof plannerDiagnostics;
  profiles: typeof profiles;
  strategies: typeof strategies;
  subscriptions: typeof subscriptions;
  teams: typeof teams;
  trials: typeof trials;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

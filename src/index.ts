import atob from "atob";
import btoa from "btoa";
global.atob = atob;
global.btoa = btoa;

export * from "./mappings";

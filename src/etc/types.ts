export interface State {
  get(key: any): any;
  set(key: any, value: any): any;
  all(): any;
  inspectIfDebugMode(): void;
}
